import { sequelize } from '../models/index.js'
import User from '../models/User.js'

async function run() {
  try {
    await sequelize.authenticate()
    await sequelize.sync()
    console.log('Connected to MySQL.\n')

    // Check the table structure
    const [results] = await sequelize.query('DESCRIBE users')
    console.log('Users table columns:')
    console.log(results)
    console.log()

    // Check all users
    const users = await User.findAll()
    console.log('All users:')
    console.log(users.map(u => u.toJSON()))

  } catch (err) {
    console.error('Error:', err)
  } finally {
    await sequelize.close()
  }
}

run()
