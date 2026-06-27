/**
 * run-migration-add-country-id.js
 * Adds country_id column to states table
 * Run once: node scripts/run-migration-add-country-id.js
 */

import { sequelize } from '../models/sequelize.js'

const qi = sequelize.getQueryInterface()

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

    // Add country_id column to states table
    if (!(await columnExists('states', 'country_id'))) {
      console.log('Adding country_id column to states table...')
      await sequelize.query(
        'ALTER TABLE `states` ADD COLUMN `country_id` INT UNSIGNED NULL DEFAULT NULL'
      )
      console.log('  ✓ country_id column added')
    } else {
      console.log('  – country_id column already exists, skipping')
    }

    // Add foreign key constraint
    if (!(await columnExists('states', 'country_id'))) {
      console.log('  – Skipping foreign key (column not added)')
    } else {
      // Check if foreign key already exists
      const [fkRows] = await sequelize.query(
        `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'states' 
         AND COLUMN_NAME = 'country_id' AND REFERENCED_TABLE_NAME = 'countries'`
      )
      
      if (fkRows.length === 0) {
        console.log('Adding foreign key constraint...')
        await sequelize.query(
          'ALTER TABLE `states` ADD CONSTRAINT `fk_states_country` FOREIGN KEY (`country_id`) REFERENCES `countries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE'
        )
        console.log('  ✓ Foreign key constraint added')
      } else {
        console.log('  – Foreign key constraint already exists, skipping')
      }
    }

    // Add index for better query performance
    if (!(await indexExists('states', 'idx_states_country_id'))) {
      console.log('Adding index on country_id...')
      await sequelize.query(
        'CREATE INDEX `idx_states_country_id` ON `states`(`country_id`)'
      )
      console.log('  ✓ Index added')
    } else {
      console.log('  – Index already exists, skipping')
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