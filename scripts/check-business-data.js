import db from '../models/index.js'

async function checkBusinessData() {
  try {
    const businesses = await db.Business.findAll({
      limit: 5,
      order: [['id', 'DESC']]
    })
    
    console.log('=== Business Directory Data ===\n')
    businesses.forEach(business => {
      console.log(`Business ID: ${business.id}`)
      
      // Parse category
      let category = business.category
      if (typeof category === 'string') {
        try {
          category = JSON.parse(category)
        } catch (e) {
          // Keep as string
        }
      }
      
      // Parse subcategory
      let subcategory = business.subcategory
      if (typeof subcategory === 'string') {
        try {
          subcategory = JSON.parse(subcategory)
        } catch (e) {
          // Keep as string
        }
      }
      
      console.log(`Category: ${JSON.stringify(category)}`)
      console.log(`Subcategory: ${JSON.stringify(subcategory)}`)
      console.log('---')
    })
    
    if (businesses.length === 0) {
      console.log('No businesses found in database')
    }
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    process.exit(0)
  }
}

checkBusinessData()