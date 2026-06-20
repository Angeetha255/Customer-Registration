/**
 * reset-levels-final.js
 * Creates the levels table with the EXACT schema from requirements:
 *   - id (Primary Key, Auto Increment)
 *   - joiner (User ID of the member)
 *   - sponsor (User ID of the sponsor/ancestor)
 *   - level (Integer)
 *
 * Run once: node scripts/reset-levels-final.js
 */

import { Sequelize } from 'sequelize'
import 'dotenv/config'

const sequelize = new Sequelize(
  process.env.DB_NAME || 'customer_management',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
)

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
    console.log('Connected to MySQL.')

    if (await tableExists('levels')) {
      console.log('Dropping existing levels table...')
      await sequelize.query('DROP TABLE IF EXISTS `levels`')
      console.log('  ✓ levels table dropped')
    }

    console.log('Creating levels table with correct schema...')
    await sequelize.query(`
      CREATE TABLE \`levels\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`joiner\` INT UNSIGNED NOT NULL,
        \`sponsor\` INT UNSIGNED NOT NULL,
        \`level\` INT UNSIGNED NOT NULL DEFAULT 1,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_joiner\` (\`joiner\`),
        INDEX \`idx_sponsor_level\` (\`sponsor\`, \`level\`),
        CONSTRAINT \`fk_levels_joiner\` FOREIGN KEY (\`joiner\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
        CONSTRAINT \`fk_levels_sponsor\` FOREIGN KEY (\`sponsor\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log('  ✓ levels table created with correct schema')

    console.log('\n✅ Reset complete. Now run: npm run backfill-levels')
  } catch (err) {
    console.error('\n❌ Reset failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()