/**
 * migrate-business-directory.js
 * Restructures Business Directory into 3 independent tables:
 *   - company table (Business Name, Email, Owner Name, Website, Description, Year of Establishment, GST Number, Yearly Turnover, Number of Employees)
 *   - business table (Company ID, Category, Country, State, District, Area, Pincode, Business Hours)
 *   - products table (Company ID, Cover Image, Product Images, Gallery, Product Name, Display Price, Product Price)
 *
 * Run once: node scripts/migrate-business-directory.js
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

async function tableExists(table) {
  const [rows] = await sequelize.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    { replacements: [table] }
  )
  return rows.length > 0
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.')

    // ── 1. Create company table ───────────────────────────────────────────
    if (!(await tableExists('company'))) {
      console.log('Creating company table...')
      await sequelize.query(`
        CREATE TABLE \`company\` (
          \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          \`businessName\` VARCHAR(255) NOT NULL,
          \`email\` VARCHAR(255) NOT NULL,
          \`ownerName\` VARCHAR(255),
          \`website\` VARCHAR(255),
          \`description\` TEXT,
          \`yearOfEstablishment\` INT,
          \`gstNumber\` VARCHAR(255),
          \`yearlyTurnover\` VARCHAR(255),
          \`numberOfEmployees\` INT,
          \`createdBy\` INT UNSIGNED,
          FOREIGN KEY (\`createdBy\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `)
      console.log('  ✓ company table created')
    } else {
      console.log('  – company table already exists, skipping')
    }

    // ── 2. Modify business table ─────────────────────────────────────────
    // Remove columns moved to company table
    const columnsToRemove = ['businessName', 'email', 'mobileNumber', 'website', 'description', 'yearOfEstablishment', 'mapLocation', 'numberOfEmployees', 'yearlyTurnover', 'mainCategory', 'subCategory']
    for (const column of columnsToRemove) {
      if (await columnExists('business', column)) {
        console.log(`Dropping ${column} from business table...`)
        await sequelize.query(`ALTER TABLE \`business\` DROP COLUMN \`${column}\``)
        console.log(`  ✓ ${column} removed`)
      }
    }

    // Rename mainCategory to category if it still exists
    if (await columnExists('business', 'mainCategory')) {
      console.log('Renaming mainCategory to category...')
      await sequelize.query(`ALTER TABLE \`business\` CHANGE COLUMN \`mainCategory\` \`category\` VARCHAR(255) NOT NULL`)
      console.log('  ✓ mainCategory renamed to category')
    }

    // Add category column if it doesn't exist
    if (!(await columnExists('business', 'category'))) {
      console.log('Adding category column to business table...')
      await sequelize.query(`ALTER TABLE \`business\` ADD COLUMN \`category\` VARCHAR(255) NOT NULL`)
      console.log('  ✓ category column added')
    }

    // Add companyId column if it doesn't exist
    if (!(await columnExists('business', 'companyId'))) {
      console.log('Adding companyId column to business table...')
      await sequelize.query(`ALTER TABLE \`business\` ADD COLUMN \`companyId\` INT UNSIGNED`)
      await sequelize.query(`ALTER TABLE \`business\` ADD FOREIGN KEY (\`companyId\`) REFERENCES \`company\`(\`id\`) ON DELETE SET NULL`)
      console.log('  ✓ companyId column added with foreign key')
    } else {
      console.log('  – companyId column already exists, skipping')
    }

    // ── 3. Modify products table ─────────────────────────────────────────
    // Drop businessId foreign key and column
    if (await columnExists('products', 'businessId')) {
      console.log('Dropping businessId from products table...')
      // First drop the foreign key constraint
      try {
        await sequelize.query(`ALTER TABLE \`products\` DROP FOREIGN KEY \`products_ibfk_1\``)
      } catch (err) {
        // Foreign key might not exist or have different name
        console.log('  – foreign key constraint not found or already dropped')
      }
      await sequelize.query(`ALTER TABLE \`products\` DROP COLUMN \`businessId\``)
      console.log('  ✓ businessId removed')
    }

    // Add companyId column if it doesn't exist
    if (!(await columnExists('products', 'companyId'))) {
      console.log('Adding companyId column to products table...')
      await sequelize.query(`ALTER TABLE \`products\` ADD COLUMN \`companyId\` INT UNSIGNED`)
      await sequelize.query(`ALTER TABLE \`products\` ADD FOREIGN KEY (\`companyId\`) REFERENCES \`company\`(\`id\`) ON DELETE CASCADE`)
      console.log('  ✓ companyId column added with foreign key')
    } else {
      console.log('  – companyId column already exists, skipping')
    }

    // Add gallery column if it doesn't exist
    if (!(await columnExists('products', 'gallery'))) {
      console.log('Adding gallery column to products table...')
      await sequelize.query(`ALTER TABLE \`products\` ADD COLUMN \`gallery\` JSON`)
      console.log('  ✓ gallery column added')
    } else {
      console.log('  – gallery column already exists, skipping')
    }

    console.log('\n✅ Business Directory migration complete. You can now start the server with: npm run dev')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
