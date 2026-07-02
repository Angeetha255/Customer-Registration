/* global process */
import { sequelize } from '../models/sequelize.js'

async function fixReviewsTable() {
  try {
    await sequelize.authenticate()
    console.log('Connected to DB')

    // Check if the reviews table exists
    const [tables] = await sequelize.query(
      "SHOW TABLES LIKE 'reviews'"
    )

    if (tables.length === 0) {
      console.log('reviews table does not exist — will be created by sequelize.sync()')
      process.exit(0)
    }

    console.log('reviews table exists, checking columns...')
    const [columns] = await sequelize.query('SHOW COLUMNS FROM `reviews`')
    const colNames = columns.map(c => c.Field)
    console.log('Existing columns:', colNames)

    const alterParts = []

    if (!colNames.includes('company_id')) {
      alterParts.push('ADD COLUMN `company_id` INT UNSIGNED NULL')
      console.log('  → Will add company_id')
    }
    if (!colNames.includes('product_id')) {
      alterParts.push('ADD COLUMN `product_id` INT UNSIGNED NULL')
      console.log('  → Will add product_id')
    }
    if (!colNames.includes('user_name')) {
      alterParts.push("ADD COLUMN `user_name` VARCHAR(120) NOT NULL DEFAULT ''")
      console.log('  → Will add user_name')
    }
    if (!colNames.includes('user_email')) {
      alterParts.push("ADD COLUMN `user_email` VARCHAR(255) NOT NULL DEFAULT ''")
      console.log('  → Will add user_email')
    }
    if (!colNames.includes('rating')) {
      alterParts.push('ADD COLUMN `rating` TINYINT UNSIGNED NOT NULL DEFAULT 5')
      console.log('  → Will add rating')
    }
    if (!colNames.includes('comment')) {
      alterParts.push("ADD COLUMN `comment` TEXT NOT NULL")
      console.log('  → Will add comment')
    }
    if (!colNames.includes('is_verified')) {
      alterParts.push('ADD COLUMN `is_verified` TINYINT(1) NOT NULL DEFAULT 1')
      console.log('  → Will add is_verified')
    }
    if (!colNames.includes('user_avatar')) {
      alterParts.push('ADD COLUMN `user_avatar` VARCHAR(500) NULL')
      console.log('  → Will add user_avatar')
    }

    if (alterParts.length > 0) {
      const sql = `ALTER TABLE \`reviews\` ${alterParts.join(', ')}`
      console.log('\nRunning:', sql)
      await sequelize.query(sql)
      console.log('✅ reviews table patched successfully')
    } else {
      console.log('✅ reviews table already has all required columns')
    }

    process.exit(0)
  } catch (err) {
    console.error('Error fixing reviews table:', err.message)
    process.exit(1)
  }
}

fixReviewsTable()
