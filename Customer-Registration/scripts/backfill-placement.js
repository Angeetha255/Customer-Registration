/**
 * backfill-placement.js
 *
 * Calculates and writes placementId + position for all existing users
 * whose placement columns are currently NULL.
 *
 * Strategy:
 *  1. Load all users ordered by id ASC (registration order).
 *  2. The very first user (lowest id) becomes the tree root — no parent.
 *  3. For each subsequent user (in id order):
 *       a. If referredBy is set  → BFS from referrer node.
 *       b. Otherwise             → BFS from root node.
 *     Assign the first vacant slot found.
 *
 * Run:  node scripts/backfill-placement.js
 */

import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import { getChildren } from '../services/binaryTree.js'

// ── In-memory BFS (uses live DB state as we write placements) ─────────────────

const findSlot = async (startId, skipId) => {
  const MAX_NODES = 4095
  const queue = [startId]
  const seen = new Set()

  while (queue.length > 0 && seen.size < MAX_NODES) {
    const currentId = queue.shift()
    if (seen.has(currentId)) continue
    seen.add(currentId)

    const { left, right } = await getChildren(currentId)

    if (left === null) return { parentId: currentId, position: 'LEFT' }
    if (right === null) return { parentId: currentId, position: 'RIGHT' }

    if (left !== skipId) queue.push(left)
    if (right !== skipId) queue.push(right)
  }
  return null
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.\n')

    // Load all users in registration order
    const users = await User.findAll({ order: [['id', 'ASC']] })

    if (users.length === 0) {
      console.log('No users found. Nothing to backfill.')
      return
    }

    const rootId = users[0].id
    console.log(`Tree root: user id=${rootId} (${users[0].name})\n`)

    let updated = 0
    let skipped = 0

    for (const user of users) {
      // Skip if already placed
      if (user.placementId !== null && user.position !== null) {
        console.log(`  SKIP  id=${user.id} (${user.name}) — already placed at parent=${user.placementId} ${user.position}`)
        skipped++
        continue
      }

      // The root user has no parent
      if (user.id === rootId) {
        console.log(`  ROOT  id=${user.id} (${user.name}) — no parent (tree root)`)
        // Explicitly set NULL to mark as intentionally processed root
        // (placementId stays NULL for root — it IS the root)
        skipped++
        continue
      }

      // Determine start node for BFS
      let startId = rootId
      if (user.referredBy) {
        // Verify referrer exists in DB
        const referrer = await User.findByPk(user.referredBy, { attributes: ['id'] })
        if (referrer) {
          startId = user.referredBy
        }
      }

      const slot = await findSlot(startId, user.id)

      if (!slot) {
        console.log(`  WARN  id=${user.id} (${user.name}) — no vacant slot found, skipping`)
        skipped++
        continue
      }

      await User.update(
        { placementId: slot.parentId, position: slot.position },
        { where: { id: user.id } }
      )

      console.log(`  PLACE id=${user.id} (${user.name}) → parent=${slot.parentId} ${slot.position}${user.referredBy ? ` [referredBy=${user.referredBy}]` : ' [no referral]'}`)
      updated++
    }

    console.log(`\n✅ Backfill complete. Updated: ${updated}, Skipped/Root: ${skipped}`)
  } catch (err) {
    console.error('\n❌ Backfill failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
