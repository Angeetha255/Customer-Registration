/**
 * migrate-additional-fields.js
 * Adds additional fields to Business Directory tables:
 *   - mobile_number column to company table
 *   - subcategory column to business table
 *
 * Run once: node scripts/migrate-additional-fields.js
 */

import { sequelize } from '../models/sequelize.js'

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

    // ── 1. Add mobile_number column to company table ─────────────────────
    if (!(await columnExists('company', 'mobileNumber'))) {
      console.log('Adding mobileNumber column to company table...')
      await sequelize.query(`ALTER TABLE \`company\` ADD COLUMN \`mobileNumber\` VARCHAR(20)`)
      console.log('  ✓ mobileNumber column added')
    } else {
      console.log('  – mobileNumber column already exists, skipping')
    }

    // ── 2. Add subcategory column to business table ───────────────────────
    if (!(await columnExists('business', 'subcategory'))) {
      console.log('Adding subcategory column to business table...')
      await sequelize.query(`ALTER TABLE \`business\` ADD COLUMN \`subcategory\` VARCHAR(255)`)
      console.log('  ✓ subcategory column added')
    } else {
      console.log('  – subcategory column already exists, skipping')
    }

    console.log('\n✅ Additional fields migration complete. You can now start the server with: npm run dev')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
