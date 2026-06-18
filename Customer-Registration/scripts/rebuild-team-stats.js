/**
 * rebuild-team-stats.js
 * Rebuilds teamcount, teamactcount, refcount, refactcount using referral downline logic.
 * Run: node scripts/rebuild-team-stats.js
 */
import { sequelize } from '../models/index.js'
import { rebuildAllStats } from '../services/teamStats.js'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected.\nRebuilding all stats...')
    await rebuildAllStats()
    console.log('✅ Stats rebuild complete.')
  } catch (err) {
    console.error('❌ Rebuild failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
