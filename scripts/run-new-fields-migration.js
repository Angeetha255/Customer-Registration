import { sequelize } from '../models/sequelize.js'

async function runMigration() {
  try {
    console.log('Running migration: Add map_link, youtube_link, and product_category_id columns...')
    
    // Add map_link to company table
    await sequelize.query(`
      ALTER TABLE company 
      ADD COLUMN IF NOT EXISTS map_link TEXT NULL AFTER pincode
    `)
    console.log('✓ Added map_link column to company table')

    // Add youtube_link and product_category_id to products table
    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS youtube_link VARCHAR(500) NULL AFTER descriptions
    `)
    console.log('✓ Added youtube_link column to products table')

    await sequelize.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS product_category_id INT UNSIGNED NULL AFTER youtube_link
    `)
    console.log('✓ Added product_category_id column to products table')

    // Add index for product_category_id
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(product_category_id)
    `)
    console.log('✓ Created index on product_category_id')

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()