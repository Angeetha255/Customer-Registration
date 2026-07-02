/**
 * run-youtube-links-migration.js
 * Adds youtube_links JSON column to the products table.
 *
 * Run once: node scripts/run-youtube-links-migration.js
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

    if (!(await columnExists('products', 'youtube_links'))) {
      console.log('Adding youtube_links column to products table...')
      await sequelize.query(
        'ALTER TABLE products ADD COLUMN youtube_links JSON NULL DEFAULT NULL'
      )
      console.log('  ✓ youtube_links column added')
    } else {
      console.log('  – youtube_links column already exists, skipping')
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