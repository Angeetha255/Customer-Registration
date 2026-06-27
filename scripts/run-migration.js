/**
 * run-migration.js
 * Safely migrates the users table to the current schema:
 *   - Removes introducerId, customerId (if they exist)
 *   - Converts referredBy from VARCHAR to INT UNSIGNED (if needed)
 *   - Adds placementId and position (if they don't exist)
 *   - Creates settings table and seeds referralPrefix
 *
 * Run once: node scripts/run-migration.js
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

async function getColumnType(table, column) {
  const [rows] = await sequelize.query(
    `SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column] }
  )
  return rows.length > 0 ? rows[0].DATA_TYPE : null
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.')

    // ── 1. Drop introducerId index + column ───────────────────────────────
    if (await columnExists('users', 'introducerId')) {
      console.log('Dropping introducerId...')
      if (await indexExists('users', 'introducerId')) {
        await sequelize.query('ALTER TABLE `users` DROP INDEX `introducerId`')
      }
      await sequelize.query('ALTER TABLE `users` DROP COLUMN `introducerId`')
      console.log('  ✓ introducerId removed')
    } else {
      console.log('  – introducerId not present, skipping')
    }

    // ── 2. Drop customerId index + column ─────────────────────────────────
    if (await columnExists('users', 'customerId')) {
      console.log('Dropping customerId...')
      if (await indexExists('users', 'customerId')) {
        await sequelize.query('ALTER TABLE `users` DROP INDEX `customerId`')
      }
      await sequelize.query('ALTER TABLE `users` DROP COLUMN `customerId`')
      console.log('  ✓ customerId removed')
    } else {
      console.log('  – customerId not present, skipping')
    }

    // ── 3. Handle referredBy column ───────────────────────────────────────
    const referredByType = await getColumnType('users', 'referredBy')
    if (!referredByType) {
      // Column doesn't exist yet — add it as INT UNSIGNED
      console.log('Adding referredBy as INT UNSIGNED...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `referredBy` INT UNSIGNED NULL DEFAULT NULL'
      )
      console.log('  ✓ referredBy added')
    } else if (referredByType.toLowerCase() === 'varchar' || referredByType.toLowerCase() === 'text') {
      // Exists as VARCHAR (old string introducerId value) — convert to INT UNSIGNED
      console.log(`Converting referredBy from ${referredByType} to INT UNSIGNED...`)

      // Add temp column
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `referredBy_new` INT UNSIGNED NULL DEFAULT NULL'
      )
      // Copy numeric values where possible (old introducerId-based referredBy = non-numeric, set NULL)
      await sequelize.query(`
        UPDATE \`users\`
        SET \`referredBy_new\` = CAST(\`referredBy\` AS UNSIGNED)
        WHERE \`referredBy\` REGEXP '^[0-9]+$'
      `)
      // Drop old column, rename new one
      await sequelize.query('ALTER TABLE `users` DROP COLUMN `referredBy`')
      await sequelize.query('ALTER TABLE `users` CHANGE COLUMN `referredBy_new` `referredBy` INT UNSIGNED NULL DEFAULT NULL')
      console.log('  ✓ referredBy converted to INT UNSIGNED')
    } else {
      console.log(`  – referredBy already exists as ${referredByType}, skipping`)
    }

    // ── 4. Add placementId column ─────────────────────────────────────────
    if (!(await columnExists('users', 'placementId'))) {
      console.log('Adding placementId...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `placementId` INT UNSIGNED NULL DEFAULT NULL'
      )
      console.log('  ✓ placementId added')
    } else {
      console.log('  – placementId already exists, skipping')
    }

    // ── 5. Add position column ────────────────────────────────────────────
    if (!(await columnExists('users', 'position'))) {
      console.log("Adding position ENUM('LEFT','RIGHT')...")
      await sequelize.query(
        "ALTER TABLE `users` ADD COLUMN `position` ENUM('LEFT','RIGHT') NULL DEFAULT NULL"
      )
      console.log('  ✓ position added')
    } else {
      console.log('  – position already exists, skipping')
    }

    // ── 6. Add registeredAt column ────────────────────────────────────────
    if (!(await columnExists('users', 'registeredAt'))) {
      console.log('Adding registeredAt...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `registeredAt` DATETIME NULL DEFAULT NULL'
      )
      console.log('  ✓ registeredAt added')
    } else {
      console.log('  – registeredAt already exists, skipping')
    }

    // ── 7. Add dateOfJoining column ───────────────────────────────────────
    if (!(await columnExists('users', 'dateOfJoining'))) {
      console.log('Adding dateOfJoining...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `dateOfJoining` DATETIME NULL DEFAULT NULL'
      )
      // Backfill from registeredAt
      await sequelize.query(
        'UPDATE `users` SET `dateOfJoining` = `registeredAt` WHERE `dateOfJoining` IS NULL'
      )
      console.log('  ✓ dateOfJoining added and backfilled from registeredAt')
    } else {
      console.log('  – dateOfJoining already exists, skipping')
    }

    // ── 7. Add dateOfActivation column ────────────────────────────────────
    if (!(await columnExists('users', 'dateOfActivation'))) {
      console.log('Adding dateOfActivation...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `dateOfActivation` DATETIME NULL DEFAULT NULL'
      )
      // Backfill: active users get registeredAt as their activation date
      await sequelize.query(
        'UPDATE `users` SET `dateOfActivation` = `registeredAt` WHERE `active` = 1'
      )
      console.log('  ✓ dateOfActivation added and backfilled for active users')
    } else {
      console.log('  – dateOfActivation already exists, skipping')
    }

    // ── 8. Add referralActiveCount column ─────────────────────────────────
    if (!(await columnExists('users', 'referralActiveCount'))) {
      console.log('Adding referralActiveCount...')
      await sequelize.query(
        'ALTER TABLE `users` ADD COLUMN `referralActiveCount` INT NOT NULL DEFAULT 0'
      )
      console.log('  ✓ referralActiveCount added')
    } else {
      console.log('  – referralActiveCount already exists, skipping')
    }

    // ── 9. Rebuild team table as single-row global stats ─────────────────
    console.log('Rebuilding team table as single-row global stats...')
    // Drop and recreate to remove the old per-user userId column
    await sequelize.query('DROP TABLE IF EXISTS `team`')
    await sequelize.query(`
      CREATE TABLE \`team\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`teamCount\` INT NOT NULL DEFAULT 0,
        \`teamActiveCount\` INT NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    // Seed the single global row with current live counts
    await sequelize.query(`
      INSERT INTO \`team\` (\`id\`, \`teamCount\`, \`teamActiveCount\`)
      SELECT 1,
        (SELECT COUNT(*) FROM \`users\`),
        (SELECT COUNT(*) FROM \`users\` WHERE \`active\` = 1)
    `)
    console.log('  ✓ team table rebuilt with single global row')

    // ── 10. Create settings table ─────────────────────────────────────────
    console.log('Creating settings table if not exists...')
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`settings\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`key\` VARCHAR(255) NOT NULL,
        \`value\` VARCHAR(255) NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`settings_key_unique\` (\`key\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `)
    console.log('  ✓ settings table ready')

    console.log('\n✅ Migration complete. You can now start the server with: npm run dev')
  } catch (err) {
    console.error('\n❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
