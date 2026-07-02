import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'

dotenv.config()

async function runMigration() {
  let connection
  
  try {
    console.log('Starting multiple banners migration...')
    
    // Read migration SQL
    const migrationPath = path.join(process.cwd(), 'migrations', 'migrate-add-multiple-category-banners.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'customer_registration'
    })
    
    console.log('Connected to database')
    
    // Split and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...')
      await connection.execute(statement)
    }
    
    console.log('✓ Migration completed successfully')
    
    // Verify the column was added
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME IN ('banner_image', 'banner_images')
    `, [process.env.DB_NAME || 'customer_registration'])
    
    console.log('\nCurrent banner columns:')
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (${col.IS_NULLABLE === 'YES' ? 'nullable' : 'required'})`)
    })
    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\nDatabase connection closed')
    }
  }
}

runMigration()