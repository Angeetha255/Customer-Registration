/**
 * migrate-fix-topid-and-teams.js
 *
 * Migration that:
 * 1. Finds the first registered user (lowest id)
 * 2. Sets topId = own id for that user, null for all others
 * 3. Recalculates teamCount and teamActiveCount for all users (based on registration order)
 *
 * Run once:  node scripts/migrate-fix-topid-and-teams.js
 */

import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import { rebuildAllUserTeamStats } from '../services/teamStats.js'

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Connected to MySQL.\n')

    const users = await User.findAll({ order: [['id', 'ASC']] })
    console.log(`Found ${users.length} users.\n`)

    // ── Step 1: Fix topId ──────────────────────────────────────────────────
    console.log('Fixing topId...')
    const firstUser = users[0]
    if (firstUser) {
      // Set topId for first user to own id
      await User.update({ topId: firstUser.id }, { where: { id: firstUser.id } })
      console.log(`  id=${firstUser.id} (${firstUser.name}) → topId = ${firstUser.id}`)

      // Set topId to null for all other users
      const otherUsers = users.slice(1)
      for (const user of otherUsers) {
        await User.update({ topId: null }, { where: { id: user.id } })
        console.log(`  id=${user.id} (${user.name}) → topId = null`)
      }
    }
    console.log('  ✓ done\n')

    // ── Step 2: Recalculate teamCount and teamActiveCount for all users ─────
    console.log('Recalculating teamCount and teamActiveCount...')
    await rebuildAllUserTeamStats()
    // Fetch users again to show updated values
    const updatedUsers = await User.findAll({ order: [['id', 'ASC']], attributes: ['id', 'name', 'teamCount', 'teamActiveCount'] })
    for (const user of updatedUsers) {
      console.log(`  id=${user.id} (${user.name}) → teamCount=${user.teamCount}, teamActiveCount=${user.teamActiveCount}`)
    }
    console.log('  ✓ done\n')

    console.log('✅ Migration complete.')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
