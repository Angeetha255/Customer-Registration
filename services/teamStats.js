/**
 * teamStats.js
 *
 * Maintains per-user stats on the users table:
 *
 *   refcount     = total direct referrals (refid = this user)
 *   refactcount  = count of active direct referrals
 *   teamcount    = total users in entire referral downline INCLUDING self
 *   teamactcount = active users in entire referral downline INCLUDING self
 *
 * teamCount rule: count = self + all descendants
 *   Single user with no downline => teamcount = 1
 *   User 1 -> User 2 -> User 3:
 *     User 3 => teamcount = 1 (self only)
 *     User 2 => teamcount = 2 (self + User 3)
 *     User 1 => teamcount = 3 (self + User 2 + User 3)
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
 * Build a map of refid → [child user objects] from all users.
 */
const buildChildrenMap = (users) => {
  const childrenMap = {}
  for (const u of users) {
    if (u.refid) {
      if (!childrenMap[u.refid]) childrenMap[u.refid] = []
      childrenMap[u.refid].push(u)
    }
  }
  return childrenMap
}

/**
 * Count all nodes in the subtree rooted at userId EXCLUDING self.
 *
 * Returns { total, active } where:
 *   total  = all descendants only (no self)
 *   active = all active descendants only (no self)
 */
const countSubtree = (userId, childrenMap, userMap) => {
  let total = 0
  let active = 0

  const children = childrenMap[userId] || []
  for (const child of children) {
    const sub = countSubtree(child.id, childrenMap, userMap)
    total += 1 + sub.total
    active += (child.active ? 1 : 0) + sub.active
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
 * Rebuild teamcount and teamactcount for ALL users.
 *
 * teamcount    = all referral descendants only (no self)
 * teamactcount = all active referral descendants only (no self)
 */
export const rebuildAllUserTeamStats = async () => {
  const users = await User.findAll({
    attributes: ['id', 'refid', 'active'],
    order: [['id', 'ASC']],
  })

  const childrenMap = buildChildrenMap(users)
  const userMap = new Map(users.map((u) => [u.id, u.toJSON ? u.toJSON() : u]))

  for (const u of users) {
    const { total, active } = countSubtree(u.id, childrenMap, userMap)
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
 * Rebuilds team stats for all users (full rebuild is safest and fast enough).
 */
export const propagateTeamStats = async (changedUserId, referrerId = null) => {
  // Full rebuild ensures all ancestors have correct counts
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
 * Full rebuild — use after bulk migrations or imports.
 */
export const rebuildAllStats = async () => {
  await rebuildAllUserTeamStats()
  await rebuildAllReferralCounts()
}
