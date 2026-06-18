/**
 * teamStats.js
 *
 * Maintains per-user team stats stored directly on the users table:
 *
 *   users.refactcount  = active direct referrals of this user
 *   users.teamcount    = total users registered from this user onwards (including self)
 *   users.teamactcount = active users registered from this user onwards (including self if active)
 *
 * teamcount/teamactcount are based on registration order (id order).
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
 * Rebuild teamcount and teamactcount for ALL users (since it depends on registration order of all users).
 */
export const rebuildAllUserTeamStats = async () => {
  // Get all users in order of id
  const [users] = await User.sequelize.query('SELECT id, active FROM users ORDER BY id ASC')
  const totalUsers = users.length
  for (let i = 0; i < users.length; i++) {
    const userId = users[i].id
    const teamcount = totalUsers - i
    // Count active users from this user onwards
    let teamactcount = 0
    for (let j = i; j < users.length; j++) {
      if (users[j].active) {
        teamactcount++
      }
    }
    // Update the user
    await User.sequelize.query('UPDATE users SET teamcount = ?, teamactcount = ? WHERE id = ?', {
      replacements: [teamcount, teamactcount, userId]
    })
  }
}

/**
 * Rebuild teamcount and teamactcount for all users (since changing one affects all previous users).
 */
export const rebuildUserTeamStats = async () => {
  await rebuildAllUserTeamStats()
}

// ─── Propagation ──────────────────────────────────────────────────────────────

/**
 * Call after any registration or active-status change.
 * Rebuilds team stats for ALL users (since team stats depend on registration order of all users).
 *
 * @param {number}      changedUserId
 * @param {number|null} referrerId     direct referrer of the changed user
 */
export const propagateTeamStats = async (changedUserId, referrerId = null) => {
  // 1. Rebuild team stats for ALL users
  await rebuildAllUserTeamStats()

  // 2. Update direct referrer's refactcount
  if (referrerId) {
    await updateReferralActiveCount(referrerId)
  }

  // 3. Walk up and update every ancestor's refactcount
  const ancestors = await getAncestors(changedUserId)
  for (const ancestorId of ancestors) {
    await updateReferralActiveCount(ancestorId)
  }
}
