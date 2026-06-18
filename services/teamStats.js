/**
 * teamStats.js
 *
 * Maintains per-user stats on the users table:
 *
 *   refcount     = total direct referrals (refid = this user)
 *   refactcount  = active direct referrals
 *   teamcount    = total users in entire referral downline (excludes self)
 *   teamactcount = active users in entire referral downline
 */

import User from '../models/User.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Walk up the refid chain from userId to root.
 * Returns array of ancestor ids (not including userId itself).
 */
const getAncestors = async (userId) => {
  const ancestors = []
  const seen = new Set()
  let current = await User.findByPk(userId, { attributes: ['id', 'refid'] })

  while (current && current.refid && !seen.has(current.refid)) {
    seen.add(current.refid)
    ancestors.push(current.refid)
    current = await User.findByPk(current.refid, { attributes: ['id', 'refid'] })
  }
  return ancestors
}

/**
 * Build a map of refid → [child ids] from all users.
 */
const buildChildrenMap = (users) => {
  const childrenMap = {}
  for (const u of users) {
    if (u.refid) {
      if (!childrenMap[u.refid]) childrenMap[u.refid] = []
      childrenMap[u.refid].push(u.id)
    }
  }
  return childrenMap
}

/**
 * Count all descendants in the referral tree (excluding self).
 */
const countDownline = (userId, childrenMap, userMap) => {
  const children = childrenMap[userId] || []
  let total = 0
  let active = 0
  for (const childId of children) {
    total += 1
    const child = userMap.get(childId)
    if (child?.active) active += 1
    const sub = countDownline(childId, childrenMap, userMap)
    total += sub.total
    active += sub.active
  }
  return { total, active }
}

// ─── Per-user stat rebuilders ─────────────────────────────────────────────────

/**
 * Recalculate refactcount for one user.
 */
export const updateReferralActiveCount = async (referrerId) => {
  if (!referrerId) return
  const count = await User.count({ where: { refid: referrerId, active: true } })
  await User.update({ refactcount: count }, { where: { id: referrerId } })
}

/**
 * Recalculate refcount for one user.
 */
export const updateReferralCount = async (referrerId) => {
  if (!referrerId) return
  const count = await User.count({ where: { refid: referrerId } })
  await User.update({ refcount: count }, { where: { id: referrerId } })
}

/**
 * Rebuild teamcount and teamactcount for ALL users based on referral downline.
 */
export const rebuildAllUserTeamStats = async () => {
  const users = await User.findAll({
    attributes: ['id', 'refid', 'active'],
    order: [['id', 'ASC']],
  })

  const childrenMap = buildChildrenMap(users)
  const userMap = new Map(users.map((u) => [u.id, u]))

  for (const u of users) {
    const { total, active } = countDownline(u.id, childrenMap, userMap)
    await User.update(
      { teamcount: total, teamactcount: active },
      { where: { id: u.id } }
    )
  }
}

export const rebuildUserTeamStats = async () => {
  await rebuildAllUserTeamStats()
}

/**
 * Rebuild all referral counts (refcount + refactcount) for every user.
 */
export const rebuildAllReferralCounts = async () => {
  const users = await User.findAll({ attributes: ['id'], order: [['id', 'ASC']] })
  for (const u of users) {
    await updateReferralCount(u.id)
    await updateReferralActiveCount(u.id)
  }
}

// ─── Propagation ──────────────────────────────────────────────────────────────

/**
 * Call after registration, activation change, or deletion.
 * Rebuilds team stats and referral counts for affected users.
 *
 * @param {number}      changedUserId
 * @param {number|null} referrerId     direct referrer of the changed user
 */
export const propagateTeamStats = async (changedUserId, referrerId = null) => {
  await rebuildAllUserTeamStats()

  if (referrerId) {
    await updateReferralCount(referrerId)
    await updateReferralActiveCount(referrerId)
  }

  const ancestors = await getAncestors(changedUserId)
  for (const ancestorId of ancestors) {
    await updateReferralCount(ancestorId)
    await updateReferralActiveCount(ancestorId)
  }
}

/**
 * Full rebuild of all stats — use after bulk migrations.
 */
export const rebuildAllStats = async () => {
  await rebuildAllUserTeamStats()
  await rebuildAllReferralCounts()
}
