import { sequelize } from '../models/index.js'

async function run() {
  try {
    await sequelize.authenticate()
    console.log('Connected to MySQL.\n')

    // Step 1: Fix topId
    console.log('Fixing topId...')
    // Find first user (smallest id)
    const [firstUser] = await sequelize.query('SELECT id FROM users ORDER BY id ASC LIMIT 1')
    if (firstUser.length > 0) {
      const firstUserId = firstUser[0].id
      // Set topId for first user
      await sequelize.query('UPDATE users SET topId = ? WHERE id = ?', {
        replacements: [firstUserId, firstUserId]
      })
      console.log(`  id=${firstUserId} → topId = ${firstUserId}`)
      // Set topId to null for all others
      await sequelize.query('UPDATE users SET topId = NULL WHERE id != ?', {
        replacements: [firstUserId]
      })
      console.log(`  All other users → topId = NULL`)
    }
    console.log('  ✓ done\n')

    // Step 2: Recalculate teamCount and teamActiveCount
    console.log('Recalculating teamCount and teamActiveCount...')
    // Get all users in order of id
    const [users] = await sequelize.query('SELECT id, active FROM users ORDER BY id ASC')
    const totalUsers = users.length
    for (let i = 0; i < users.length; i++) {
      const userId = users[i].id
      const teamCount = totalUsers - i
      // Count active users from this user onwards
      let teamActiveCount = 0
      for (let j = i; j < users.length; j++) {
        if (users[j].active) {
          teamActiveCount++
        }
      }
      // Update the user
      await sequelize.query('UPDATE users SET teamCount = ?, teamActiveCount = ? WHERE id = ?', {
        replacements: [teamCount, teamActiveCount, userId]
      })
      console.log(`  id=${userId} → teamCount=${teamCount}, teamActiveCount=${teamActiveCount}`)
    }
    console.log('  ✓ done\n')

    console.log('✅ Migration complete!')
  } catch (err) {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await sequelize.close()
  }
}

run()
