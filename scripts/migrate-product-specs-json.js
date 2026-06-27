import { sequelize } from '../models/sequelize.js'

async function migrate() {
  try {
    console.log('Starting product specification migration...')

    // 1. Add specifications JSON column to products table
    console.log('Adding specifications JSON column to products table...')
    try {
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN specifications JSON NULL AFTER displayPrice
      `)
      console.log('  ✓ specifications column added')
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  – specifications column already exists')
      } else {
        throw err
      }
    }

    // 2. Add descriptions JSON column to products table
    console.log('Adding descriptions JSON column to products table...')
    try {
      await sequelize.query(`
        ALTER TABLE products 
        ADD COLUMN descriptions JSON NULL AFTER specifications
      `)
      console.log('  ✓ descriptions column added')
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('  – descriptions column already exists')
      } else {
        throw err
      }
    }

    // 3. Drop productPrice column
    console.log('Dropping productPrice column...')
    try {
      await sequelize.query(`
        ALTER TABLE products DROP COLUMN productPrice
      `)
      console.log('  ✓ productPrice column dropped')
    } catch (err) {
      if (err.message.includes('check that column/key exists')) {
        console.log('  – productPrice column already removed')
      } else {
        throw err
      }
    }

    // 4. Drop product_specifications table
    console.log('Dropping product_specifications table...')
    try {
      await sequelize.query(`DROP TABLE IF EXISTS product_specifications`)
      console.log('  ✓ product_specifications table dropped')
    } catch (err) {
      console.log('  – error dropping product_specifications:', err.message)
    }

    // 5. Drop product_descriptions table
    console.log('Dropping product_descriptions table...')
    try {
      await sequelize.query(`DROP TABLE IF EXISTS product_descriptions`)
      console.log('  ✓ product_descriptions table dropped')
    } catch (err) {
      console.log('  – error dropping product_descriptions:', err.message)
    }

    console.log('\nMigration completed successfully!')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

migrate()
