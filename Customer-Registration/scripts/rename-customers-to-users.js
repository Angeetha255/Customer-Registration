import { sequelize } from '../models/index.js'

async function rename() {
  try {
    const qi = sequelize.getQueryInterface()
    const tables = await qi.showAllTables()
    const hasCustomers = tables.includes('customers') || tables.includes('Customers')
    if (!hasCustomers) {
      console.log('No customers table found. Nothing to rename.')
      process.exit(0)
    }
    await qi.renameTable('customers', 'users')
    console.log('Renamed table customers -> users')
    process.exit(0)
  } catch (err) {
    console.error('Failed to rename table:', err)
    process.exit(1)
  }
}

rename()
