import { sequelize } from '../models/sequelize.js'

async function runMigration() {
  try {
    console.log('Running company verify fields migration...')
    
    // Add new columns one by one (MySQL doesn't support IF NOT EXISTS)
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN telephone_number VARCHAR(20) DEFAULT NULL`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN additional_mobile_number VARCHAR(20) DEFAULT NULL`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN verify INT DEFAULT 0`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN trust INT DEFAULT 0`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN quick_response INT DEFAULT 0`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    try {
      await sequelize.query(`ALTER TABLE company ADD COLUMN top_rated INT DEFAULT 0`)
    } catch (e) { if (!e.message.includes('Duplicate column name')) throw e }
    
    console.log('✅ Company verify fields migration completed successfully')
    process.exit(0)
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  }
}

runMigration()