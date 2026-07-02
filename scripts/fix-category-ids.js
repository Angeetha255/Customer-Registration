import db from '../models/index.js'

async function fixCategoryIds() {
  try {
    console.log('=== Fixing Category/Subcategory IDs in Database ===\n')
    
    // Get all businesses
    const businesses = await db.Business.findAll()
    
    let fixedCount = 0
    
    for (const business of businesses) {
      let needsUpdate = false
      let categoryValue = business.category
      let subcategoryValue = business.subcategory
      
      // Fix category - check if it contains IDs
      if (categoryValue) {
        let parsed = categoryValue
        let parseAttempts = 0
        const maxParseAttempts = 3
        
        // Try to parse multiple times in case of double-escaped JSON
        while (typeof parsed === 'string' && parseAttempts < maxParseAttempts) {
          try {
            parsed = JSON.parse(parsed)
            parseAttempts++
          } catch (err) {
            break
          }
        }
        
        // If it's an array of numbers, convert to names
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
          console.log(`Business ${business.id}: Converting category IDs [${parsed.join(',')}] to names...`)
          
          const categories = await db.Category.findAll({
            where: { id: parsed, status: 'active' },
            attributes: ['id', 'categoryName']
          })
          
          categoryValue = categories.map(cat => cat.categoryName)
          console.log(`  → Converted to: [${categoryValue.join(',')}]`)
          needsUpdate = true
        } else {
          console.log(`Business ${business.id}: Category appears to be names already (parsed: ${JSON.stringify(parsed)})`)
        }
      }
      
      // Fix subcategory - check if it contains IDs
      if (subcategoryValue) {
        let parsed = subcategoryValue
        let parseAttempts = 0
        const maxParseAttempts = 3
        
        // Try to parse multiple times in case of double-escaped JSON
        while (typeof parsed === 'string' && parseAttempts < maxParseAttempts) {
          try {
            parsed = JSON.parse(parsed)
            parseAttempts++
          } catch (err) {
            break
          }
        }
        
        // If it's an array of numbers, convert to names
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'number') {
          console.log(`Business ${business.id}: Converting subcategory IDs [${parsed.join(',')}] to names...`)
          
          const subcategories = await db.Subcategory.findAll({
            where: { id: parsed, status: 'active' },
            attributes: ['id', 'subcategoryName']
          })
          
          subcategoryValue = subcategories.map(sub => sub.subcategoryName)
          console.log(`  → Converted to: [${subcategoryValue.join(',')}]`)
          needsUpdate = true
        } else {
          console.log(`Business ${business.id}: Subcategory appears to be names already (parsed: ${JSON.stringify(parsed)})`)
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        // Only JSON.stringify if the value is not already a string
        const categoryToSave = typeof categoryValue === 'string' ? categoryValue : JSON.stringify(categoryValue)
        const subcategoryToSave = subcategoryValue ? (typeof subcategoryValue === 'string' ? subcategoryValue : JSON.stringify(subcategoryValue)) : null
        
        await business.update({
          category: categoryToSave,
          subcategory: subcategoryToSave
        })
        fixedCount++
      }
    }
    
    console.log(`\n=== Summary ===`)
    console.log(`Total businesses: ${businesses.length}`)
    console.log(`Fixed: ${fixedCount}`)
    console.log(`Already correct: ${businesses.length - fixedCount}`)
    
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    process.exit(0)
  }
}

fixCategoryIds()