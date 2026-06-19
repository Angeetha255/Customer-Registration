/**
 * migrate-remove-topid.js
 *
 * Removes the topId column from the users table.
 *
 * Run: node scripts/migrate-remove-topid.js
 */

import { sequelize } from '../models/index.js'

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    { replacements: [table, column] }
  )
  return rows[0].cnt > 0
}

async function run() {
  try {
    if (await columnExists('users', 'topId')) {
      await sequelize.query('ALTER TABLE `users` DROP COLUMN `topId`')
      console.log('✓ topId column removed from users table')
    } else {
      console.log('– topId column does not exist, nothing to do')
    }
    console.log('\n✅ Migration complete.')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

run()