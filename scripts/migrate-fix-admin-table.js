/**
 * migrate-fix-admin-table.js
 * Adds missing columns to the `admin` table.
 *
 * Run once: node scripts/migrate-fix-admin-table.js
 */

import { sequelize } from '../models/index.js'

async function columnExists(table, column) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  )
  return rows.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.')

    const columns = [
      { name: 'regat', type: "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP" },
      { name: 'pwdtoken', type: 'VARCHAR(255) NULL DEFAULT NULL' },
      { name: 'pwdexp', type: 'DATETIME NULL DEFAULT NULL' },
    ]

    for (const col of columns) {
      if (!(await columnExists('admin', col.name))) {
        console.log(`Adding column \`${col.name}\`...`)
        await sequelize.query(`ALTER TABLE \`admin\` ADD COLUMN \`${col.name}\` ${col.type}`)
        console.log(`  ✓ \`${col.name}\` added`)
      } else {
        console.log(`  – \`${col.name}\` already exists, skipping`)
      }
    }

    console.log('\n✅ Migration complete.')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()