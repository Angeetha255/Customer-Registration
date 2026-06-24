/**
 * migrate-add-topid.js
 *
 * 1. Adds topId column to users table (if missing).
 * 2. Backfills topId for all existing users:
 *    - Users with no referredBy, placementId, position → topId = their own id (tree root)
 *    - All other users → topId = root of their referral chain
 *
 * Run: node scripts/migrate-add-topid.js
 */
import { sequelize } from '../models/index.js'

async function columnExists(table, col) {
  const [rows] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, col] }
  )
  return rows.length > 0
}

/**
 * Walk up the referredBy chain from a given user row to find the root id.
 * Uses an in-memory map to avoid repeated DB queries.
 */
async function resolveTopId(userId, userMap) {
  const seen = new Set()
  let current = userMap.get(userId)
  while (current) {
    if (seen.has(current.id)) break // cycle guard
    seen.add(current.id)
    if (!current.referredBy) return current.id // root
    const parent = userMap.get(current.referredBy)
    if (!parent) return current.id // referrer deleted — treat as root
    current = parent
  }
  return userId // fallback
}

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected.\n')

    // Step 1: Add topId column
    if (!(await columnExists('users', 'topId'))) {
      await sequelize.query('ALTER TABLE `users` ADD COLUMN `topId` INT UNSIGNED NULL DEFAULT NULL')
      console.log('✓ topId column added')
    } else {
      console.log('– topId already exists')
    }

    // Step 2a: Root users (no placementId, no position) → topId = own id
    const [rootResult] = await sequelize.query(
      'UPDATE `users` SET `topId` = `id` WHERE `placementId` IS NULL AND `position` IS NULL AND `topId` IS NULL'
    )
    console.log(`✓ Root users backfilled: ${rootResult.affectedRows} row(s)`)

    // Step 2b: Load all users into memory for chain resolution
    const [rows] = await sequelize.query(
      'SELECT id, referredBy, placementId, position FROM users ORDER BY id'
    )
    console.log(`\nFound ${rows.length} users. Computing topId...\n`)

    // Build a map for fast lookup
    const userMap = new Map(rows.map((r) => [r.id, r]))

    // Step 3: Compute topId for every user
    for (const row of rows) {
      const topId = await resolveTopId(row.id, userMap)
      await sequelize.query('UPDATE `users` SET `topId` = ? WHERE `id` = ?', {
        replacements: [topId, row.id],
      })
      const isRoot = topId === row.id
      console.log(`  id=${row.id} → topId=${topId}${isRoot ? ' (root)' : ''}`)
    }

    // Verify
    const [result] = await sequelize.query(
      'SELECT id, topId FROM users ORDER BY id LIMIT 20'
    )
    console.log('\nVerification:')
    console.table(result)

    console.log('\n✅ topId migration complete.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
