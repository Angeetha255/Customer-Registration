/**
 * migrate-rename-admins-to-admin.js
 * Renames the `admins` table to `admin` in the database.
 *
 * Run once: node scripts/migrate-rename-admins-to-admin.js
 */

import { sequelize } from '../models/index.js'

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

    if (await tableExists('admins')) {
      if (await tableExists('admin')) {
        console.log('Both `admins` and `admin` tables exist. Dropping old `admins` table...')
        await sequelize.query('DROP TABLE `admins`')
        console.log('  ✓ Old `admins` table dropped')
      } else {
        console.log('Renaming `admins` table to `admin`...')
        await sequelize.query('RENAME TABLE `admins` TO `admin`')
        console.log('  ✓ Table renamed successfully')
      }
    } else if (await tableExists('admin')) {
      console.log('  – `admin` table already exists, nothing to do')
    } else {
      console.log('  – Neither `admins` nor `admin` table found')
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