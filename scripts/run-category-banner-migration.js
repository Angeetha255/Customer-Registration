/**
 * Run category banner migration
 * Adds banner_image column to categories table
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

async function indexExists(table, indexName) {
  const [rows] = await sequelize.query(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    { replacements: [table, indexName] }
  )
  return rows.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.')

    // Add banner_image column if it doesn't exist
    if (!(await columnExists('categories', 'banner_image'))) {
      console.log('Adding banner_image column to categories table...')
      await sequelize.query(
        'ALTER TABLE `categories` ADD COLUMN `banner_image` VARCHAR(500) NULL AFTER `status`'
      )
      console.log('  ✓ banner_image column added')
    } else {
      console.log('  – banner_image column already exists, skipping')
    }

    // Add index if it doesn't exist
    if (!(await indexExists('categories', 'idx_categories_banner_image'))) {
      console.log('Creating index on banner_image...')
      await sequelize.query(
        'CREATE INDEX `idx_categories_banner_image` ON `categories`(`banner_image`)'
      )
      console.log('  ✓ Index created')
    } else {
      console.log('  – Index already exists, skipping')
    }

    console.log('\n✅ Category banner migration complete!')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()