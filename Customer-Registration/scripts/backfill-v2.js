/**
 * backfill-v2.js
 * - Generates userId for users with null userId
 * - Rebuilds teamCount, teamActiveCount, referralActiveCount for all users
 * Run: node scripts/backfill-v2.js
 */
import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import { rebuildAllStats } from '../services/teamStats.js'
import { generateUserId } from '../services/userIdService.js'

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Connected.\n')

    const users = await User.findAll({ order: [['id', 'ASC']] })
    console.log(`${users.length} users found.\n`)

    // Step 1: Generate missing userIds
    console.log('Generating missing userIds...')
    for (const user of users) {
      if (!user.userId) {
        const uid = await generateUserId()
        await User.update({ userId: uid }, { where: { id: user.id } })
        console.log(`  id=${user.id} (${user.name}) → userId=${uid}`)
      }
    }

    // Step 2: Rebuild team stats
    console.log('\nRebuilding team stats...')
    await rebuildAllStats()
    console.log('  ✓ team stats rebuilt')

    console.log('\n✅ Backfill v2 complete.')
  } catch (err) {
    console.error('❌ Backfill failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
