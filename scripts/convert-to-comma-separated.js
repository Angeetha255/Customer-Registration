import db from '../models/index.js'

async function convertToCommaSeparated() {
  try {
    console.log('=== Converting JSON Arrays to Comma-Separated Strings ===\n')
    
    // Get all businesses
    const businesses = await db.Business.findAll()
    
    let fixedCount = 0
    
    for (const business of businesses) {
      let needsUpdate = false
      let categoryValue = business.category
      let subcategoryValue = business.subcategory
      
      // Fix category - convert JSON array to comma-separated string
      if (categoryValue && typeof categoryValue === 'string') {
        let parsed = categoryValue
        let parseCount = 0
        
        // Keep parsing until we get the actual array
        while (typeof parsed === 'string' && parseCount < 5) {
          try {
            const newParsed = JSON.parse(parsed)
            if (Array.isArray(newParsed)) {
              parsed = newParsed
              break
            } else if (typeof newParsed === 'string') {
              parsed = newParsed
              parseCount++
            } else {
              break
            }
          } catch (e) {
            break
          }
        }
        
        // If it's an array, convert to comma-separated string
        if (Array.isArray(parsed)) {
          console.log(`Business ${business.id}: Converting category from JSON array to comma-separated...`)
          console.log(`  Before: ${categoryValue}`)
          categoryValue = parsed.join(', ')
          console.log(`  After: ${categoryValue}`)
          needsUpdate = true
        }
      }
      
      // Fix subcategory - convert JSON array to comma-separated string
      if (subcategoryValue && typeof subcategoryValue === 'string') {
        let parsed = subcategoryValue
        let parseCount = 0
        
        // Keep parsing until we get the actual array
        while (typeof parsed === 'string' && parseCount < 5) {
          try {
            const newParsed = JSON.parse(parsed)
            if (Array.isArray(newParsed)) {
              parsed = newParsed
              break
            } else if (typeof newParsed === 'string') {
              parsed = newParsed
              parseCount++
            } else {
              break
            }
          } catch (e) {
            break
          }
        }
        
        // If it's an array, convert to comma-separated string
        if (Array.isArray(parsed)) {
          console.log(`Business ${business.id}: Converting subcategory from JSON array to comma-separated...`)
          console.log(`  Before: ${subcategoryValue}`)
          subcategoryValue = parsed.join(', ')
          console.log(`  After: ${subcategoryValue}`)
          needsUpdate = true
        }
      }
      
      // Update if needed
      if (needsUpdate) {
        await business.update({
          category: categoryValue,
          subcategory: subcategoryValue
        })
        fixedCount++
        console.log(`  ✓ Fixed Business ${business.id}\n`)
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

convertToCommaSeparated()