import { sequelize } from '../models/sequelize.js'

async function runMigration() {
  try {
    console.log('Running migration: Add product_category text column...')
    
    // Check if column already exists
    const [columns] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'products' 
      AND COLUMN_NAME = 'product_category'
    `)
    
    if (columns.length > 0) {
      console.log('✓ product_category column already exists, skipping')
    } else {
      // Add product_category text column to products table
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN product_category VARCHAR(255) NULL
      `)
      console.log('✓ Added product_category column to products table')
    }

    console.log('\n✅ Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

runMigration()