import db from '../models/index.js'

async function fixTripleEscaped() {
  try {
    console.log('=== Fixing Triple-Escaped Category/Subcategory Data ===\n')
    
    // Get all businesses
    const businesses = await db.Business.findAll()
    
    let fixedCount = 0
    
    for (const business of businesses) {
      let needsUpdate = false
      let categoryValue = business.category
      let subcategoryValue = business.subcategory
      
      // Fix category - deeply parse until we get the actual data
      if (categoryValue && typeof categoryValue === 'string') {
        let parsed = categoryValue
        let parseCount = 0
        
        // Keep parsing until we can't anymore
        while (typeof parsed === 'string') {
          try {
            const newParsed = JSON.parse(parsed)
            if (typeof newParsed === 'string') {
              parsed = newParsed
              parseCount++
            } else {
              parsed = newParsed
              break
            }
          } catch (err) {
            break
          }
        }
        
        // Now parsed should be the actual array
        if (Array.isArray(parsed)) {
          console.log(`Business ${business.id}: Category parsed after ${parseCount} parses: [${parsed.join(',')}]`)
          categoryValue = JSON.stringify(parsed)
          needsUpdate = true
        }
      }
      
      // Fix subcategory - deeply parse until we get the actual data
      if (subcategoryValue && typeof subcategoryValue === 'string') {
        let parsed = subcategoryValue
        let parseCount = 0
        
        // Keep parsing until we can't anymore
        while (typeof parsed === 'string') {
          try {
            const newParsed = JSON.parse(parsed)
            if (typeof newParsed === 'string') {
              parsed = newParsed
              parseCount++
            } else {
              parsed = newParsed
              break
            }
          } catch (err) {
            break
          }
        }
        
        // Now parsed should be the actual array
        if (Array.isArray(parsed)) {
          console.log(`Business ${business.id}: Subcategory parsed after ${parseCount} parses: [${parsed.join(',')}]`)
          subcategoryValue = JSON.stringify(parsed)
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

fixTripleEscaped()