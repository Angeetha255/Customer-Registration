/**
 * Genealogy service — tree building and member enrichment for customer pages.
 */

import User from '../models/User.js'
import { enrichUserStats, fmtDate } from './userEnrichment.js'

const GENEALOGY_ATTRS = [
  'id', 'name', 'userId', 'refid', 'placeid', 'position',
  'active', 'regat', 'DOJ', 'DOA',
  'refcount', 'refactcount', 'teamcount', 'teamactcount',
]

/**
 * Batch-resolve display IDs for a set of user primary keys.
 */
export const buildUserLookup = async (ids) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!uniqueIds.length) return new Map()

  const rows = await User.findAll({
    where: { id: uniqueIds },
    attributes: ['id', 'userId', 'name'],
  })
  return new Map(rows.map((r) => [r.id, r]))
}

/**
 * Calculate the placement level of a user dynamically by following placeid upwards.
 *
 * Rules:
 *   - Root user (placeid is null OR placeid === own id) => Level 1
 *   - Direct children of root => Level 2
 *   - Children of Level 2 users => Level 3
 *   - And so on recursively.
 *
 * @param {number} userId - The user ID whose level to calculate.
 * @returns {Promise<number>} The placement level (1-based).
 */
// Cache for user levels to avoid repeated database queries
const levelCache = new Map()

export const getUserLevel = async (userId, depth = 0) => {
  if (!userId) return 1
  if (depth > 100) return 1 // Safety limit to prevent infinite recursion

  // Check cache first
  if (levelCache.has(userId)) {
    return levelCache.get(userId)
  }

  const user = await User.findByPk(userId, { attributes: ['id', 'placeid'] })
  if (!user) {
    levelCache.set(userId, 1)
    return 1
  }

  // Root: no placement parent or self-referencing placement
  if (!user.placeid || user.placeid === user.id) {
    levelCache.set(userId, 1)
    return 1
  }

  // Recursively calculate parent's level and add 1
  const parentLevel = await getUserLevel(user.placeid, depth + 1)
  const level = parentLevel + 1
  levelCache.set(userId, level)
  return level
}

// Clear the cache (useful for testing or when data changes)
export const clearLevelCache = () => {
  levelCache.clear()
}

/**
 * Enrich a user record for genealogy table display.
 */
export const enrichGenealogyMember = (user, lookup, prefix) => {
  const base = enrichUserStats(user)
  const referrer = user.refid ? lookup.get(user.refid) : null
  const placement = user.placeid ? lookup.get(user.placeid) : null
  const userIdDisplay = user.userId || `#${user.id}`
  const refIdDisplay = referrer ? (referrer.userId || `${prefix}${referrer.id}`) : '-'
  const placementIdDisplay = placement ? (placement.userId || `${prefix}${placement.id}`) : '-'

  return {
    ...base,
    userIdDisplay,
    userIdNameDisplay: user.name ? `${userIdDisplay} - ${user.name}` : userIdDisplay,
    refIdDisplay,
    referrerName: referrer?.name || null,
    refIdNameDisplay: referrer?.name ? `${refIdDisplay} - ${referrer.name}` : refIdDisplay,
    placementIdDisplay,
    placementName: placement?.name || null,
    placementIdNameDisplay: placement?.name ? `${placementIdDisplay} - ${placement.name}` : placementIdDisplay,
    DOJDisplay: fmtDate(user.DOJ),
    DOADisplay: fmtDate(user.DOA),
  }
}

/**
 * Get all referral downline user ids for a root user (BFS via refid).
 */
export const getDownlineIds = async (rootId) => {
  const allUsers = await User.findAll({ attributes: ['id', 'refid'] })
  const childrenMap = {}
  for (const u of allUsers) {
    if (u.refid) {
      if (!childrenMap[u.refid]) childrenMap[u.refid] = []
      childrenMap[u.refid].push(u.id)
    }
  }

  const result = []
  const queue = [...(childrenMap[rootId] || [])]
  const seen = new Set()
  while (queue.length) {
    const id = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)
    result.push(id)
    const children = childrenMap[id] || []
    for (const c of children) queue.push(c)
  }
  return result
}

const sortByUserOrder = (a, b) => {
  const aKey = a.userId || ''
  const bKey = b.userId || ''
  if (aKey && bKey && aKey !== bKey) return aKey.localeCompare(bKey, undefined, { numeric: true })
  return a.id - b.id
}

const getReferralDownlineIdsFromMap = (rootId, childrenMap) => {
  const result = []
  const queue = [...(childrenMap.get(rootId) || [])]
  const seen = new Set()

  while (queue.length) {
    const user = queue.shift()
    if (!user || seen.has(user.id)) continue
    seen.add(user.id)
    result.push(user.id)

    for (const child of childrenMap.get(user.id) || []) {
      queue.push(child)
    }
  }

  return result
}

const calculateReferralStats = (user, childrenMap, userMap) => {
  const directReferrals = childrenMap.get(user.id) || []
  const totalDirectReferrals = directReferrals.length
  const activeDirectReferrals = directReferrals.filter((child) => child.active).length
  const downlineIds = getReferralDownlineIdsFromMap(user.id, childrenMap)
  const totalTeamMembers = downlineIds.length
  const activeTeamMembers = downlineIds
    .map((id) => userMap.get(id))
    .filter((member) => member?.active).length

  return {
    refStatus: `${activeDirectReferrals} / ${totalDirectReferrals}`,
    teamStatus: `${activeTeamMembers} / ${totalTeamMembers}`,
    activeDirectReferrals,
    totalDirectReferrals,
    activeTeamMembers,
    totalTeamMembers,
  }
}

const toReferralHierarchyMember = (user, level, prefix, childrenMap, userMap) => {
  const referrer = user.refid ? userMap.get(user.refid) : null
  const stats = calculateReferralStats(user, childrenMap, userMap)
  const userIdDisplay = user.userId || `#${user.id}`
  const refIdDisplay = referrer ? (referrer.userId || `${prefix}${referrer.id}`) : '-'

  return {
    id: user.id,
    name: user.name,
    userId: user.userId,
    userIdDisplay,
    userIdNameDisplay: user.name ? `${userIdDisplay} - ${user.name}` : userIdDisplay,
    refIdDisplay,
    referrerName: referrer?.name || null,
    refIdNameDisplay: referrer?.name ? `${refIdDisplay} - ${referrer.name}` : refIdDisplay,
    refid: user.refid,
    level,
    active: !!user.active,
    activeStatus: user.active ? 'Active' : 'Inactive',
    DOJDisplay: fmtDate(user.DOJ),
    DOADisplay: fmtDate(user.DOA),
    ...stats,
  }
}

/**
 * Build the My Team referral hierarchy for a user.
 * Includes the user's upline from Top ID to self, then the user's complete
 * referral downline. Placement fields are intentionally not used.
 */
export const buildReferralHierarchyForUser = async (currentUserId, prefix) => {
  const rows = await User.findAll({
    attributes: [
      'id', 'name', 'userId', 'refid', 'active',
      'refcount', 'refactcount', 'teamcount', 'teamactcount',
      'DOJ', 'DOA',
    ],
    order: [['id', 'ASC']],
  })

  const users = rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row))
  const userMap = new Map(users.map((user) => [user.id, user]))
  const childrenMap = new Map()

  for (const user of users) {
    if (!user.refid) continue
    if (!childrenMap.has(user.refid)) childrenMap.set(user.refid, [])
    childrenMap.get(user.refid).push(user)
  }

  for (const children of childrenMap.values()) {
    children.sort(sortByUserOrder)
  }

  const currentUser = userMap.get(currentUserId)
  if (!currentUser) return { members: [], tree: null }

  const ancestorChain = []
  const seenAncestors = new Set()
  let cursor = currentUser

  while (cursor && !seenAncestors.has(cursor.id)) {
    ancestorChain.unshift(cursor)
    seenAncestors.add(cursor.id)
    cursor = cursor.refid ? userMap.get(cursor.refid) : null
  }

  const members = []
  const memberIds = new Set()

  const buildDownlineNode = (user, level) => {
    const member = toReferralHierarchyMember(user, level, prefix, childrenMap, userMap)
    memberIds.add(user.id)
    members.push(member)

    const children = (childrenMap.get(user.id) || []).map((child) => buildDownlineNode(child, level + 1))
    return {
      ...member,
      children,
      hasChildren: children.length > 0,
    }
  }

  let tree = null
  let parentNode = null

  ancestorChain.forEach((user, index) => {
    const level = index

    if (user.id === currentUser.id) {
      const node = buildDownlineNode(user, level)
      if (parentNode) {
        parentNode.children = [node]
        parentNode.hasChildren = true
      } else {
        tree = node
      }
      return
    }

    const member = toReferralHierarchyMember(user, level, prefix, childrenMap, userMap)
    if (!memberIds.has(user.id)) {
      memberIds.add(user.id)
      members.push(member)
    }

    const node = {
      ...member,
      children: [],
      hasChildren: true,
    }

    if (parentNode) {
      parentNode.children = [node]
    } else {
      tree = node
    }
    parentNode = node
  })

  return { members, tree }
}

export const getPlacementLevelSummary = async (rootId, prefix) => {
  const rows = await User.findAll({
    attributes: GENEALOGY_ATTRS,
    order: [['id', 'ASC']],
  })

  const users = rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row))
  const userMap = new Map(users.map((user) => [user.id, user]))
  const childrenMap = new Map()

  for (const user of users) {
    if (!user.placeid) continue
    if (!childrenMap.has(user.placeid)) childrenMap.set(user.placeid, [])
    childrenMap.get(user.placeid).push(user)
  }

  const levels = []
  const queue = [{ id: rootId, level: 1 }]
  const seen = new Set()

  while (queue.length) {
    const { id, level } = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)

    const user = userMap.get(id)
    if (!user) continue

    if (!levels[level]) levels[level] = []
    levels[level].push(user)

    for (const child of childrenMap.get(id) || []) {
      queue.push({ id: child.id, level: level + 1 })
    }
  }

  const lookupIds = users.flatMap((user) => [user.refid, user.placeid].filter(Boolean))
  const lookup = await buildUserLookup(lookupIds)

  return levels
    .filter((_, level) => level > 0)
    .map((members, index) => ({
      level: index + 1,
      totalCount: members.length,
      activeCount: members.filter((m) => m.active).length,
      members: members.map((member) => ({
        ...enrichGenealogyMember(member, lookup, prefix),
        level: index + 1,
      })),
    }))
}

/**
 * Get enriched root node for Team View.
 */
export const getTeamViewRoot = async (rootId, prefix) => {
  const user = await User.findByPk(rootId, { attributes: GENEALOGY_ATTRS })
  if (!user) return null

  const level = await getUserLevel(rootId)

  const lookup = await buildUserLookup([user.refid, user.placeid].filter(Boolean))
  const enriched = enrichGenealogyMember(user, lookup, prefix)
  const childCount = await User.count({ where: { placeid: rootId } })

  return { ...enriched, level, hasChildren: childCount > 0 }
}

/**
 * Build placement binary tree rooted at userId (full tree — admin/debug use).
 */
export const buildPlacementTree = async (rootId, prefix) => {
  const root = await User.findByPk(rootId, { attributes: GENEALOGY_ATTRS })
  if (!root) return null

  const buildNode = async (userId) => {
    const user = await User.findByPk(userId, { attributes: GENEALOGY_ATTRS })
    if (!user) return null

    const children = await User.findAll({
      where: { placeid: userId },
      attributes: GENEALOGY_ATTRS,
      order: [['id', 'ASC']],
    })

    let left = null
    let right = null
    for (const child of children) {
      const node = await buildNode(child.id)
      if (child.position === 'LEFT') left = node
      if (child.position === 'RIGHT') right = node
    }

    const level = await getUserLevel(user.id)

    const lookup = await buildUserLookup([user.refid, user.placeid].filter(Boolean))
    const enriched = enrichGenealogyMember(user, lookup, prefix)

    return {
      ...enriched,
      level,
      left,
      right,
      hasChildren: !!(left || right),
    }
  }

  return buildNode(rootId)
}

/**
 * Build placement subtree for a node (lazy load for expand/collapse).
 */
export const getPlacementChildren = async (parentId, prefix) => {
  const children = await User.findAll({
    where: { placeid: parentId },
    attributes: GENEALOGY_ATTRS,
    order: [['id', 'ASC']],
  })

  const lookupIds = children.flatMap((c) => [c.refid, c.placeid].filter(Boolean))
  const lookup = await buildUserLookup(lookupIds)

  const enrichedChildren = await Promise.all(
    children.map(async (child) => {
      const level = await getUserLevel(child.id)
      const enriched = enrichGenealogyMember(child, lookup, prefix)
      return {
        ...enriched,
        level,
        hasChildren: true, // client will lazy-load to verify
      }
    })
  )

  return enrichedChildren
}

/**
 * Check if a user has placement children.
 */
export const hasPlacementChildren = async (userId) => {
  const count = await User.count({ where: { placeid: userId } })
  return count > 0
}

/**
 * Get all users at a specific placement level from the tree root.
 */
export const getPlacementLevelUsers = async (rootId, level, prefix) => {
  const rows = await User.findAll({
    attributes: GENEALOGY_ATTRS,
    order: [['id', 'ASC']],
  })

  const users = rows.map((row) => (typeof row.toJSON === 'function' ? row.toJSON() : row))
  const userMap = new Map(users.map((user) => [user.id, user]))
  const childrenMap = new Map()

  for (const user of users) {
    if (!user.placeid) continue
    if (!childrenMap.has(user.placeid)) childrenMap.set(user.placeid, [])
    childrenMap.get(user.placeid).push(user)
  }

  // BFS to find users at exact level
  const queue = [{ id: rootId, currentLevel: 1 }]
  const seen = new Set()
  const result = []

  while (queue.length) {
    const { id, currentLevel } = queue.shift()
    if (seen.has(id)) continue
    seen.add(id)

    if (currentLevel === level) {
      const user = userMap.get(id)
      if (user) result.push(user)
    }

    if (currentLevel < level) {
      for (const child of childrenMap.get(id) || []) {
        queue.push({ id: child.id, currentLevel: currentLevel + 1 })
      }
    }
  }

  const lookupIds = result.flatMap((u) => [u.refid, u.placeid].filter(Boolean))
  const lookup = await buildUserLookup(lookupIds)

  return result.map((member) => ({
    ...enrichGenealogyMember(member, lookup, prefix),
    level,
  }))
}