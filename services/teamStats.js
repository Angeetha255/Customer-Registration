/**
 * teamStats.js
 *
 * Maintains three DB values whenever users register or change active status:
 *
 *   users.referralActiveCount  (per referrer)
 *     = count of direct referrals of that user who are currently active
 *
 *   team.teamCount             (global single row)
 *     = total number of users in the system
 *
 *   team.teamActiveCount       (global single row)
 *     = total number of active users in the system
 *
 * The `team` table always contains exactly one row (id = 1).
 */

import User from '../models/User.js'
import Team from '../models/Team.js'

// ─── referralActiveCount ──────────────────────────────────────────────────────

/**
 * Recalculate and save referralActiveCount for a single referrer.
 * referralActiveCount = COUNT of users where referredBy = referrerId AND active = true
 */
export const updateReferralActiveCount = async (referrerId) => {
  if (!referrerId) return
  const activeCount = await User.count({
    where: { referredBy: referrerId, active: true },
  })
  await User.update(
    { referralActiveCount: activeCount },
    { where: { id: referrerId } }
  )
}

// ─── Global team stats ────────────────────────────────────────────────────────

/**
 * Recompute and upsert the single global team row.
 * teamCount       = total users
 * teamActiveCount = total active users
 */
export const refreshGlobalTeamStats = async () => {
  const teamCount       = await User.count()
  const teamActiveCount = await User.count({ where: { active: true } })

  // Always upsert id=1 — the one and only global row
  const existing = await Team.findByPk(1)
  if (existing) {
    existing.teamCount       = teamCount
    existing.teamActiveCount = teamActiveCount
    await existing.save()
  } else {
    await Team.create({ id: 1, teamCount, teamActiveCount })
  }
}

// ─── Combined trigger ─────────────────────────────────────────────────────────

/**
 * Call this after every registration or active-status change.
 *
 * @param {number|null} referrerId — direct referrer of the changed user (if any)
 */
export const propagateTeamStats = async (referrerId = null) => {
  // 1. Update the direct referrer's referralActiveCount
  if (referrerId) {
    await updateReferralActiveCount(referrerId)
  }

  // 2. Refresh the single global team row
  await refreshGlobalTeamStats()
}
