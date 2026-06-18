/**
 * backfill-stats.js
 *
 * Backfills/recalculates all stats for existing users:
 *   - dateOfJoining      → copied from registeredAt (if null)
 *   - dateOfActivation   → set to registeredAt for currently active users (if null)
 *   - referralActiveCount → recalculated per user from live data
 *   - team table          → single global row: teamCount + teamActiveCount
 *
 * Run once:  node scripts/backfill-stats.js
 */

import { sequelize } from '../models/index.js'
import User from '../models/User.js'
import '../models/Team.js'
import { updateReferralActiveCount, refreshGlobalTeamStats } from '../services/teamStats.js'

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Connected to MySQL.\n')

    const users = await User.findAll({ order: [['id', 'ASC']] })
    console.log(`Found ${users.length} users.\n`)

    // ── Step 1: dateOfJoining and dateOfActivation ─────────────────────────
    console.log('Setting dateOfJoining / dateOfActivation...')
    for (const user of users) {
      const updates = {}
      if (!user.dateOfJoining)    updates.dateOfJoining    = user.registeredAt || new Date()
      if (!user.dateOfActivation && user.active) updates.dateOfActivation = user.registeredAt || new Date()
      if (Object.keys(updates).length) {
        await User.update(updates, { where: { id: user.id } })
        console.log(`  id=${user.id} (${user.name})`, Object.keys(updates).join(', '))
      }
    }
    console.log('  ✓ done\n')

    // ── Step 2: referralActiveCount per referrer ───────────────────────────
    console.log('Recalculating referralActiveCount...')
    for (const user of users) {
      await updateReferralActiveCount(user.id)
    }
    console.log('  ✓ done\n')

    // ── Step 3: Global team row ────────────────────────────────────────────
    console.log('Refreshing global team stats...')
    await refreshGlobalTeamStats()
    console.log('  ✓ done\n')

    console.log('✅ Backfill complete.')
  } catch (err) {
    console.error('\n❌ Backfill failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
