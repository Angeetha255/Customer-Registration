/**
 * backfill-levels.js
 * Populates the `levels` table for existing users.
 *
 * For each user with a sponsor (refid), inserts:
 *   - Direct sponsor relationship (level 1)
 *   - All ancestor relationships (levels 2, 3, etc.)
 *
 * Root users (no refid) are skipped.
 *
 * Run once: node scripts/backfill-levels.js
 */

import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import Level from '../models/Level.js'

async function backfill() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.')

    // Clear existing level records to avoid duplicates
    console.log('Clearing existing level records...')
    await Level.destroy({ where: {} })
    // Reset auto-increment to start from 1
    await sequelize.query('ALTER TABLE `levels` AUTO_INCREMENT = 1')
    console.log('  ✓ Existing level records cleared and auto-increment reset')

    // Get all users with their refid
    console.log('Fetching all users...')
    const users = await User.findAll({
      attributes: ['id', 'refid'],
      order: [['id', 'ASC']],
    })
    console.log(`  ✓ Found ${users.length} users`)

    // Build a map for quick lookup
    const userMap = new Map(users.map((u) => [u.id, u]))

    let totalRecords = 0
    let skippedRoot = 0

    for (const user of users) {
      // Skip root users (no sponsor)
      if (!user.refid) {
        skippedRoot++
        continue
      }

      // Verify sponsor exists
      const sponsor = userMap.get(user.refid)
      if (!sponsor) {
        console.warn(`  ⚠ User ${user.id} has invalid sponsor ${user.refid}, skipping`)
        continue
      }

      // Step 1: Insert direct sponsor relationship (level 1)
      await Level.create({
        joiner: user.id,
        sponsor: sponsor.id,
        level: 1,
      })
      totalRecords++

      // Step 2: Walk up the sponsor chain and insert ancestor records
      const ancestors = []
      let current = sponsor
      const seen = new Set()

      while (current && current.refid && !seen.has(current.refid)) {
        seen.add(current.refid)
        const ancestor = userMap.get(current.refid)
        if (ancestor) {
          ancestors.push(ancestor)
        }
        current = ancestor
      }

      for (let i = 0; i < ancestors.length; i++) {
        await Level.create({
          joiner: user.id,
          sponsor: ancestors[i].id,
          level: i + 2, // direct sponsor is level 1, next ancestor is level 2, etc.
        })
        totalRecords++
      }
    }

    console.log(`\n✅ Backfill complete:`)
    console.log(`   - Skipped ${skippedRoot} root users (no sponsor)`)
    console.log(`   - Created ${totalRecords} level records`)
  } catch (err) {
    console.error('\n❌ Backfill failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

backfill()