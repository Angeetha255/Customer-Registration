/**
 * binaryTree.js — Binary-tree auto-placement service
 *
 * RULES:
 * - Every user in the system is placed in a single global binary tree.
 * - Each node can have at most 2 children: LEFT and RIGHT.
 * - A child is identified by: placementId = parent.id AND position = 'LEFT'|'RIGHT'
 *
 * PLACEMENT LOGIC:
 * - Referred user  → BFS starts from the referrer's node.
 * - Non-referred   → BFS starts from the global tree root (lowest-id user).
 *
 * BFS always finds the FIRST vacant slot (level-order traversal).
 */

import User from '../models/User.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch LEFT and RIGHT child ids for a given parent id.
 * Returns { left: id|null, right: id|null }
 */
export const getChildren = async (parentId) => {
  const children = await User.findAll({
    where: { placeid: parentId },
    attributes: ['id', 'position'],
  })
  let left = null
  let right = null
  for (const c of children) {
    if (c.position === 'LEFT') left = c.id
    if (c.position === 'RIGHT') right = c.id
  }
  return { left, right }
}

/**
 * Get the global tree root — the user with the smallest id.
 * All non-referred registrations are placed relative to this root.
 * Returns null if no users exist yet (first-ever registration).
 */
export const getGlobalRoot = async () => {
  const root = await User.findOne({ order: [['id', 'ASC']] })
  return root ? root.id : null
}

// ─── BFS placement ────────────────────────────────────────────────────────────

/**
 * BFS through the binary tree starting at `startId`.
 * Returns the first vacant slot as { parentId, position }, or null if tree is full.
 *
 * @param {number} startId  - Root node id to start BFS from.
 * @param {number} [excludeId] - Id to skip during traversal (used to exclude the
 *                               new user's own id from the search space).
 * @returns {{ parentId: number, position: 'LEFT'|'RIGHT' } | null}
 */
export const findPlacement = async (startId, excludeId = null) => {
  const MAX_NODES = 4095 // safety cap — 12 full levels

  const queue = [startId]
  const seen = new Set()

  while (queue.length > 0 && seen.size < MAX_NODES) {
    const currentId = queue.shift()
    if (seen.has(currentId)) continue
    seen.add(currentId)

    const { left, right } = await getChildren(currentId)

    if (left === null) return { parentId: currentId, position: 'LEFT' }
    if (right === null) return { parentId: currentId, position: 'RIGHT' }

    // Both filled — enqueue children (skip excludeId to avoid infinite loops)
    if (left !== excludeId) queue.push(left)
    if (right !== excludeId) queue.push(right)
  }

  return null
}

/**
 * Determine placement for a NEW user:
 *  - Always BFS from global root (ignores referrer for placement purposes)
 *
 * Returns { parentId, position } or null (tree full — extremely unlikely).
 *
 * @param {number|null} referredById
 * @param {number|null} [newUserId]  - Pass the new user's id to exclude from BFS
 *                                    (relevant only during backfill).
 */
export const determinePlacement = async (referredById, newUserId = null) => {
  // Always use global root for placement, ignore referrer
  const rootId = await getGlobalRoot()
  if (!rootId) return null // no users exist yet (this user IS the first)

  // If the root IS the new user itself, tree is empty → no parent
  if (rootId === newUserId) return null

  return findPlacement(rootId, newUserId)
}
