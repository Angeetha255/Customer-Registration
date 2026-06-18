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
 * Enrich a user record for genealogy table display.
 */
export const enrichGenealogyMember = (user, lookup, prefix) => {
  const base = enrichUserStats(user)
  const referrer = user.refid ? lookup.get(user.refid) : null
  const placement = user.placeid ? lookup.get(user.placeid) : null

  return {
    ...base,
    userIdDisplay: user.userId || `#${user.id}`,
    refIdDisplay: referrer ? (referrer.userId || `${prefix}${referrer.id}`) : '—',
    placementIdDisplay: placement ? (placement.userId || `${prefix}${placement.id}`) : '—',
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

/**
 * Get enriched root node for Team View.
 */
export const getTeamViewRoot = async (rootId, prefix) => {
  const user = await User.findByPk(rootId, { attributes: GENEALOGY_ATTRS })
  if (!user) return null

  const lookup = await buildUserLookup([user.refid, user.placeid].filter(Boolean))
  const enriched = enrichGenealogyMember(user, lookup, prefix)
  const childCount = await User.count({ where: { placeid: rootId } })

  return { ...enriched, hasChildren: childCount > 0 }
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

    const lookup = await buildUserLookup([user.refid, user.placeid].filter(Boolean))
    const enriched = enrichGenealogyMember(user, lookup, prefix)

    return {
      ...enriched,
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

  return children.map((child) => {
    const enriched = enrichGenealogyMember(child, lookup, prefix)
    return {
      ...enriched,
      hasChildren: true, // client will lazy-load to verify
    }
  })
}

/**
 * Check if a user has placement children.
 */
export const hasPlacementChildren = async (userId) => {
  const count = await User.count({ where: { placeid: userId } })
  return count > 0
}
