/**
 * fix-team-topid.js
 *
 * Migration script that:
 *  1. Sets topId = own id for the FIRST registered user only.
 *  2. Sets topId = NULL for all other users.
 *  3. Rebuilds teamcount (self + all referral descendants) for all users.
 *  4. Rebuilds teamactcount (self if active + active referral descendants).
 *  5. Rebuilds refcount and refactcount.
 *
 * Run: node scripts/fix-team-topid.js
 */
import { sequelize } from '../models/index.js'
import User from '../models/User.js'

// ── TopId fix ─────────────────────────────────────────────────────────────────

async function fixTopId() {
  // Clear topId for everyone first
  await sequelize.query('UPDATE `users` SET `topId` = NULL')
  console.log('  ✓ Cleared topId for all users')

  // Find the first registered user (lowest id, with no placement = tree root)
  const [firstUsers] = await sequelize.query(
    'SELECT id FROM `users` ORDER BY id ASC LIMIT 1'
  )
  if (!firstUsers.length) {
    console.log('  – No users found, skipping topId')
    return
  }

  const firstId = firstUsers[0].id
  await sequelize.query('UPDATE `users` SET `topId` = ? WHERE `id` = ?', {
    replacements: [firstId, firstId],
  })
  console.log(`  ✓ topId = ${firstId} set for user id=${firstId} (first registered user)`)
}

// ── Team stats fix ────────────────────────────────────────────────────────────

function buildChildrenMap(users) {
  const map = {}
  for (const u of users) {
    if (u.refid) {
      if (!map[u.refid]) map[u.refid] = []
      map[u.refid].push(u)
    }
  }
  return map
}

function countSubtree(userId, childrenMap, userMap) {
  let total = 0
  let active = 0

  const children = childrenMap[userId] || []
  for (const child of children) {
    const sub = countSubtree(child.id, childrenMap, userMap)
    total += 1 + sub.total
    active += (child.active ? 1 : 0) + sub.active
  }
  return { total, active }
}

async function fixTeamStats() {
  const rows = await User.findAll({
    attributes: ['id', 'refid', 'active'],
    order: [['id', 'ASC']],
  })

  const users = rows.map((r) => r.toJSON())
  const childrenMap = buildChildrenMap(users)
  const userMap = new Map(users.map((u) => [u.id, u]))

  for (const u of users) {
    const { total, active } = countSubtree(u.id, childrenMap, userMap)
    await User.update(
      { teamcount: total, teamactcount: active },
      { where: { id: u.id } }
    )
    console.log(`  id=${u.id} → teamcount=${total}, teamactcount=${active}`)
  }
}

async function fixReferralCounts() {
  const rows = await User.findAll({ attributes: ['id'], order: [['id', 'ASC']] })
  for (const u of rows) {
    const refcount    = await User.count({ where: { refid: u.id } })
    const refactcount = await User.count({ where: { refid: u.id, active: true } })
    await User.update({ refcount, refactcount }, { where: { id: u.id } })
  }
  console.log(`  ✓ refcount + refactcount updated for ${rows.length} users`)
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Connected.\n')

    console.log('Step 1: Fix topId...')
    await fixTopId()

    console.log('\nStep 2: Rebuild teamcount + teamactcount...')
    await fixTeamStats()

    console.log('\nStep 3: Rebuild refcount + refactcount...')
    await fixReferralCounts()

    // Verify
    console.log('\nVerification:')
    const [rows] = await sequelize.query(
      'SELECT id, topId, teamcount, teamactcount, refcount, refactcount FROM users ORDER BY id'
    )
    console.table(rows)

    console.log('\n✅ Migration complete.')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    console.error(err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
