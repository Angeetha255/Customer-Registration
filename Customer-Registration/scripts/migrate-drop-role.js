/**
 * migrate-drop-role.js
 * Safely drops the `role` column from the `users` table.
 * Run ONCE after verifying the app works without role.
 *
 * Usage: node scripts/migrate-drop-role.js
 */
import { sequelize } from '../models/index.js'

async function columnExists(table, col) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, col] }
  )
  return rows.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected.\n')

    if (await columnExists('users', 'role')) {
      await sequelize.query('ALTER TABLE `users` DROP COLUMN `role`')
      console.log('✓ role column dropped from users table')
    } else {
      console.log('– role column does not exist, nothing to drop')
    }

    console.log('\n✅ Migration complete.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
