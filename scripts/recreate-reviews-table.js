/* global process */
import { sequelize } from '../models/sequelize.js'

async function recreateReviewsTable() {
  try {
    await sequelize.authenticate()
    console.log('Connected to DB')

    // Check row count before dropping
    const [rows] = await sequelize.query('SELECT COUNT(*) as count FROM `reviews`').catch(() => [[{ count: 0 }]])
    const count = rows[0]?.count || 0
    console.log(`reviews table has ${count} rows`)

    if (count > 0) {
      console.log('⚠️  Table has data — backing up first...')
      await sequelize.query('CREATE TABLE `reviews_backup` AS SELECT * FROM `reviews`')
      console.log('✅ Backup created as reviews_backup')
    }

    console.log('Dropping old reviews table...')
    await sequelize.query('DROP TABLE IF EXISTS `reviews`')
    console.log('✅ Old reviews table dropped')

    console.log('Done. Run "node server.js" — Sequelize will recreate it with the correct schema.')
    process.exit(0)
  } catch (err) {
    console.error('Error:', err.message)
    process.exit(1)
  }
}

recreateReviewsTable()
