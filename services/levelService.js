/**
 * levelService.js
 *
 * Manages the `levels` table which stores all sponsor-to-member
 * level relationships. This is the single source of truth for
 * team-level data. Names are fetched from users table via joins.
 */

import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import Level from '../models/Level.js'

/**
 * Insert level records for a newly registered user.
 *
 * For every ancestor in the referral chain (via refid), insert a row:
 *   joiner = newUserId
 *   sponsor = ancestorId
 *   level = distance from newUserId to ancestorId (1 = direct sponsor)
 *
 * Root users (no sponsor / refid) do NOT get any level records.
 */
export const createLevelRecordsForNewUser = async (newUserId, directSponsorId) => {
  if (!directSponsorId) return

  // Get sponsor details
  const sponsor = await User.findByPk(directSponsorId, {
    attributes: ['id', 'refid'],
  })
  if (!sponsor) return

  // Step 1: direct sponsor relationship (level 1)
  await Level.create({
    joiner: newUserId,
    sponsor: sponsor.id,
    level: 1,
  })

  // Step 2: walk up the sponsor chain and insert ancestor records
  const ancestors = []
  let current = sponsor
  const seen = new Set()

  while (current && current.refid && !seen.has(current.refid)) {
    seen.add(current.refid)
    const ancestor = await User.findByPk(current.refid, {
      attributes: ['id', 'refid'],
    })
    if (ancestor) {
      ancestors.push(ancestor)
    }
    current = ancestor
  }

  for (let i = 0; i < ancestors.length; i++) {
    await Level.create({
      joiner: newUserId,
      sponsor: ancestors[i].id,
      level: i + 2, // direct sponsor is level 1, next ancestor is level 2, etc.
    })
  }
}

/**
 * Get level summary for a sponsor.
 *
 * Returns an array of { level, activeCount, totalCount } rows grouped by level,
 * ordered by level ascending.
 *
 * Joins with users table to get active status.
 */
export const getLevelSummary = async (sponsorId) => {
  // Get all level records for this sponsor
  const levelRecords = await Level.findAll({
    where: { sponsor: sponsorId },
    attributes: ['level', 'joiner'],
    order: [['level', 'ASC']],
    raw: true,
  })

  // Get unique joiner IDs to fetch their active status
  const joinerIds = [...new Set(levelRecords.map((r) => r.joiner))]
  
  // Fetch active status for all joiners
  const users = joinerIds.length > 0 
    ? await User.findAll({
        where: { id: joinerIds },
        attributes: ['id', 'active'],
      })
    : []
  
  const activeMap = new Map(users.map((u) => [u.id, u.active]))

  // Group by level and calculate counts
  const levelMap = new Map()
  for (const record of levelRecords) {
    const level = record.level
    if (!levelMap.has(level)) {
      levelMap.set(level, { totalCount: 0, activeCount: 0 })
    }
    const stats = levelMap.get(level)
    stats.totalCount++
    if (activeMap.get(record.joiner)) {
      stats.activeCount++
    }
  }

  // Convert to array and sort by level
  return Array.from(levelMap.entries())
    .map(([level, stats]) => ({
      level: Number(level),
      activeCount: stats.activeCount,
      totalCount: stats.totalCount,
    }))
    .sort((a, b) => a.level - b.level)
}

/**
 * Get all users at a specific level for a given sponsor.
 *
 * Joins the levels table with the users table to return full
 * user details including names for every joiner at the requested level.
 *
 * Used by the "Team View" page when a level row is expanded.
 */
export const getLevelUsers = async (sponsorId, level) => {
  const rows = await Level.findAll({
    where: { sponsor: sponsorId, level },
    order: [['id', 'ASC']],
  })

  // Get unique joiner and sponsor IDs to fetch their details
  const joinerIds = [...new Set(rows.map((r) => r.joiner))]
  const sponsorIds = [...new Set(rows.map((r) => r.sponsor))]
  const allIds = [...new Set([...joinerIds, ...sponsorIds])]

  // Fetch user details from users table
  const users = allIds.length > 0
    ? await User.findAll({
        where: { id: allIds },
        attributes: ['id', 'name', 'email', 'phone', 'userId', 'active', 'refcount', 'refactcount', 'teamcount', 'teamactcount', 'refid'],
      })
    : []

  const userMap = new Map(users.map((u) => [u.id, u]))

  // Get all unique refid values from joiners to fetch their referrer details
  const referrerIds = [...new Set(users.map((u) => u.refid).filter(Boolean))]
  const referrers = referrerIds.length > 0
    ? await User.findAll({
        where: { id: referrerIds },
        attributes: ['id', 'name', 'userId'],
      })
    : []
  const referrerMap = new Map(referrers.map((r) => [r.id, r]))

  return rows.map((row) => {
    const json = typeof row.toJSON === 'function' ? row.toJSON() : row
    const joiner = userMap.get(json.joiner)
    
    if (!joiner) return null

    const joinerJson = typeof joiner.toJSON === 'function' ? joiner.toJSON() : joiner
    const referrer = joinerJson.refid ? referrerMap.get(joinerJson.refid) : null
    const referrerJson = referrer ? (typeof referrer.toJSON === 'function' ? referrer.toJSON() : referrer) : null

    return {
      id: json.id,
      joinerId: joinerJson.id,
      joinerName: joinerJson.name,
      sponsorId: referrerJson ? referrerJson.id : null,
      sponsorName: referrerJson ? referrerJson.name : null,
      level: json.level,
      userIdDisplay: joinerJson.userId || `#${joinerJson.id}`,
      sponsorUserIdDisplay: joinerJson.refid ? (referrerJson?.userId || `#${joinerJson.refid}`) : '-',
      refcount: joinerJson.refcount || 0,
      refactcount: joinerJson.refactcount || 0,
      teamcount: joinerJson.teamcount || 0,
      teamactcount: joinerJson.teamactcount || 0,
    }
  }).filter(Boolean)
}

/**
 * Delete all level records where the given user is the joiner.
 * Called when a user is deleted.
 */
export const deleteLevelRecordsForJoiner = async (joinerId) => {
  await Level.destroy({ where: { joiner: joinerId } })
}

/**
 * Delete all level records where the given user is the sponsor.
 * Called when a user is deleted (cascade should handle this,
 * but we keep it explicit for safety).
 */
export const deleteLevelRecordsForSponsor = async (sponsorId) => {
  await Level.destroy({ where: { sponsor: sponsorId } })
}