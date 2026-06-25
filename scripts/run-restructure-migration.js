/**
 * run-restructure-migration.js
 * Migrates the database schema for the restructured fields:
 *   - Moves location fields from business to company table
 *   - Moves website/description from company to business table
 *   - Adds product pricing fields (MRP, discount, etc.)
 *   - Creates product_specifications and product_descriptions tables
 *   - Adds is_enabled field to products
 *
 * Run once: node scripts/run-restructure-migration.js
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

async function tableExists(tableName) {
  const [rows] = await sequelize.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [tableName] }
  )
  return rows.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.\n')

    // ── 1. Add location fields to company table ─────────────────────────────
    console.log('Adding location fields to company table...')
    if (!(await columnExists('company', 'country'))) {
      await sequelize.query('ALTER TABLE `company` ADD COLUMN `country` VARCHAR(100) DEFAULT "India" AFTER `email`')
      console.log('  ✓ country added')
    } else {
      console.log('  – country already exists')
    }

    if (!(await columnExists('company', 'state'))) {
      await sequelize.query('ALTER TABLE `company` ADD COLUMN `state` VARCHAR(100) AFTER `country`')
      console.log('  ✓ state added')
    } else {
      console.log('  – state already exists')
    }

    if (!(await columnExists('company', 'district'))) {
      await sequelize.query('ALTER TABLE `company` ADD COLUMN `district` VARCHAR(100) AFTER `state`')
      console.log('  ✓ district added')
    } else {
      console.log('  – district already exists')
    }

    if (!(await columnExists('company', 'area'))) {
      await sequelize.query('ALTER TABLE `company` ADD COLUMN `area` VARCHAR(100) AFTER `district`')
      console.log('  ✓ area added')
    } else {
      console.log('  – area already exists')
    }

    if (!(await columnExists('company', 'pincode'))) {
      await sequelize.query('ALTER TABLE `company` ADD COLUMN `pincode` VARCHAR(10) AFTER `area`')
      console.log('  ✓ pincode added')
    } else {
      console.log('  – pincode already exists')
    }

    // ── 2. Add businessName back to business table if missing ──────────────
    console.log('\nChecking business table structure...')
    if (!(await columnExists('business', 'businessName'))) {
      await sequelize.query('ALTER TABLE `business` ADD COLUMN `businessName` VARCHAR(255) NOT NULL FIRST')
      console.log('  ✓ businessName added to business')
    } else {
      console.log('  – businessName already exists in business')
    }

    // ── 3. Add website and description to business table ───────────────────
    console.log('\nAdding website and description to business table...')
    if (!(await columnExists('business', 'website'))) {
      await sequelize.query('ALTER TABLE `business` ADD COLUMN `website` VARCHAR(255) AFTER `businessName`')
      console.log('  ✓ website added')
    } else {
      console.log('  – website already exists')
    }

    if (!(await columnExists('business', 'description'))) {
      await sequelize.query('ALTER TABLE `business` ADD COLUMN `description` TEXT AFTER `website`')
      console.log('  ✓ description added')
    } else {
      console.log('  – description already exists')
    }

    // ── 4. Remove location fields from business table ──────────────────────
    console.log('\nRemoving old location fields from business table...')
    const businessColumnsToRemove = ['country', 'state', 'district', 'area', 'pincode']
    for (const col of businessColumnsToRemove) {
      if (await columnExists('business', col)) {
        await sequelize.query(`ALTER TABLE \`business\` DROP COLUMN \`${col}\``)
        console.log(`  ✓ ${col} removed from business`)
      } else {
        console.log(`  – ${col} not present in business`)
      }
    }

    // ── 5. Remove website and description from company table ───────────────
    console.log('\nRemoving old website/description from company table...')
    const companyColumnsToRemove = ['website', 'description']
    for (const col of companyColumnsToRemove) {
      if (await columnExists('company', col)) {
        await sequelize.query(`ALTER TABLE \`company\` DROP COLUMN \`${col}\``)
        console.log(`  ✓ ${col} removed from company`)
      } else {
        console.log(`  – ${col} not present in company`)
      }
    }

    // ── 6. Add product pricing fields ──────────────────────────────────────
    console.log('\nAdding product pricing fields...')
    if (!(await columnExists('products', 'product_mrp'))) {
      await sequelize.query('ALTER TABLE `products` ADD COLUMN `product_mrp` DECIMAL(10,2) AFTER `productName`')
      console.log('  ✓ product_mrp added')
    } else {
      console.log('  – product_mrp already exists')
    }

    if (!(await columnExists('products', 'discount_percentage'))) {
      await sequelize.query('ALTER TABLE `products` ADD COLUMN `discount_percentage` DECIMAL(5,2) DEFAULT 0 AFTER `product_mrp`')
      console.log('  ✓ discount_percentage added')
    } else {
      console.log('  – discount_percentage already exists')
    }

    if (!(await columnExists('products', 'discount_price'))) {
      await sequelize.query('ALTER TABLE `products` ADD COLUMN `discount_price` DECIMAL(10,2) AFTER `discount_percentage`')
      console.log('  ✓ discount_price added')
    } else {
      console.log('  – discount_price already exists')
    }

    if (!(await columnExists('products', 'is_enabled'))) {
      await sequelize.query('ALTER TABLE `products` ADD COLUMN `is_enabled` BOOLEAN DEFAULT TRUE AFTER `discount_price`')
      console.log('  ✓ is_enabled added')
    } else {
      console.log('  – is_enabled already exists')
    }

    // ── 7. Create product_specifications table ─────────────────────────────
    console.log('\nCreating product_specifications table...')
    if (!(await tableExists('product_specifications'))) {
      await sequelize.query(`
        CREATE TABLE \`product_specifications\` (
          \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`product_id\` INT UNSIGNED NOT NULL,
          \`specification_name\` VARCHAR(255) NOT NULL,
          \`specification_detail\` TEXT NOT NULL,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('  ✓ product_specifications table created')
    } else {
      console.log('  – product_specifications table already exists')
    }

    // ── 8. Create product_descriptions table ───────────────────────────────
    console.log('\nCreating product_descriptions table...')
    if (!(await tableExists('product_descriptions'))) {
      await sequelize.query(`
        CREATE TABLE \`product_descriptions\` (
          \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
          \`product_id\` INT UNSIGNED NOT NULL,
          \`description_point\` TEXT NOT NULL,
          \`display_order\` INT DEFAULT 0,
          \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('  ✓ product_descriptions table created')
    } else {
      console.log('  – product_descriptions table already exists')
    }

    console.log('\n✅ Restructure migration complete.')
    console.log('You can now start the server with: npm run dev')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()