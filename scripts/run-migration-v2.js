/**
 * run-migration-v2.js
 * Adds: userId, teamCount, teamActiveCount columns to users table.
 * Drops: team table.
 * Run: node scripts/run-migration-v2.js
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

    // Add userId
    if (!(await columnExists('users', 'userId'))) {
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `userId` VARCHAR(255) NULL UNIQUE")
      console.log('✓ userId added')
    } else { console.log('– userId exists') }

    // Add teamCount
    if (!(await columnExists('users', 'teamCount'))) {
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `teamCount` INT NOT NULL DEFAULT 0")
      console.log('✓ teamCount added')
    } else { console.log('– teamCount exists') }

    // Add teamActiveCount
    if (!(await columnExists('users', 'teamActiveCount'))) {
      await sequelize.query("ALTER TABLE `users` ADD COLUMN `teamActiveCount` INT NOT NULL DEFAULT 0")
      console.log('✓ teamActiveCount added')
    } else { console.log('– teamActiveCount exists') }

    // Drop team table
    await sequelize.query('DROP TABLE IF EXISTS `team`')
    console.log('✓ team table dropped')

    // Seed userIdPrefix setting
    await sequelize.query(
      "INSERT IGNORE INTO `settings` (`key`, `value`) VALUES ('userIdPrefix', 'MEM')"
    )
    console.log("✓ userIdPrefix = 'MEM' seeded")

    console.log('\n✅ Migration v2 complete.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
