import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Business from '../models/Business.js'
import Company from '../models/Company.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'

const router = express.Router()

// Helper function to convert category/subcategory IDs to names
const convertIdsToNames = async (categoryData, subcategoryData) => {
  let categoryNames = categoryData
  let subcategoryNames = subcategoryData

  // Handle category - convert IDs to names if needed
  if (categoryData) {
    try {
      // Check if it's a JSON string of IDs
      const parsedCategory = typeof categoryData === 'string' ? JSON.parse(categoryData) : categoryData
      
      if (Array.isArray(parsedCategory) && parsedCategory.length > 0 && typeof parsedCategory[0] === 'number') {
        // It's an array of IDs - convert to names
        const categories = await Category.findAll({
          where: { id: parsedCategory, status: 'active' },
          attributes: ['id', 'categoryName']
        })
        categoryNames = categories.map(cat => cat.categoryName)
      } else if (typeof parsedCategory === 'number') {
        // It's a single ID - convert to name
        const category = await Category.findByPk(parsedCategory)
        categoryNames = category ? [category.categoryName] : [parsedCategory.toString()]
      }
    } catch (err) {
      // If parsing fails, assume it's already names
      console.log('Category data appears to be names, not IDs')
    }
  }

  // Handle subcategory - convert IDs to names if needed
  if (subcategoryData) {
    try {
      // Check if it's a JSON string of IDs
      const parsedSubcategory = typeof subcategoryData === 'string' ? JSON.parse(subcategoryData) : subcategoryData
      
      if (Array.isArray(parsedSubcategory) && parsedSubcategory.length > 0 && typeof parsedSubcategory[0] === 'number') {
        // It's an array of IDs - convert to names
        const subcategories = await Subcategory.findAll({
          where: { id: parsedSubcategory, status: 'active' },
          attributes: ['id', 'subcategoryName']
        })
        subcategoryNames = subcategories.map(sub => sub.subcategoryName)
      } else if (typeof parsedSubcategory === 'number') {
        // It's a single ID - convert to name
        const subcategory = await Subcategory.findByPk(parsedSubcategory)
        subcategoryNames = subcategory ? [subcategory.subcategoryName] : [parsedSubcategory.toString()]
      }
    } catch (err) {
      // If parsing fails, assume it's already names
      console.log('Subcategory data appears to be names, not IDs')
    }
  }

  return { categoryNames, subcategoryNames }
}

// Helper function to convert array to comma-separated string
const arrayToCommaSeparated = (arr) => {
  if (!arr || !Array.isArray(arr)) return arr
  return arr.join(', ')
}

// POST /api/business-directory - Create a new business catalogue entry
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      companyId,
      category,
      subcategory,
      website,
      description,
      businessHours
    } = req.body

    // Validation
    if (!category || !Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: 'At least one category is required' })
    }

    if (subcategory && Array.isArray(subcategory) && subcategory.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 subcategories can be selected' })
    }

    // Convert IDs to names before saving
    const { categoryNames, subcategoryNames } = await convertIdsToNames(category, subcategory)

    const business = await Business.create({
      companyId: companyId || null,
      category: arrayToCommaSeparated(categoryNames),
      subcategory: arrayToCommaSeparated(subcategoryNames) || null,
      website: website || null,
      description: description || null,
      businessHours: businessHours || null,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Business created successfully', business })
  } catch (err) {
    console.error('Error creating business:', err)
    res.status(500).json({ message: 'Failed to create business' })
  }
})

// PUT /api/business-directory/:id - Update a business catalogue entry
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      companyId,
      category,
      subcategory,
      website,
      description,
      businessHours
    } = req.body

    // Validation
    if (!category || !Array.isArray(category) || category.length === 0) {
      return res.status(400).json({ message: 'At least one category is required' })
    }

    if (subcategory && Array.isArray(subcategory) && subcategory.length > 10) {
      return res.status(400).json({ message: 'Maximum 10 subcategories can be selected' })
    }

    const business = await Business.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })

    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    // Convert IDs to names before saving
    const { categoryNames, subcategoryNames } = await convertIdsToNames(category, subcategory)

    await business.update({
      companyId: companyId || null,
      category: arrayToCommaSeparated(categoryNames),
      subcategory: arrayToCommaSeparated(subcategoryNames) || null,
      website: website || null,
      description: description || null,
      businessHours: businessHours || null,
    })

    res.status(200).json({ message: 'Business updated successfully', business })
  } catch (err) {
    console.error('Error updating business:', err)
    res.status(500).json({ message: 'Failed to update business' })
  }
})

// GET /api/business-directory - Get all business catalogue entries for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.findAll({
      where: { createdBy: req.user.id },
      order: [['id', 'DESC']]
    })
    
    // Convert comma-separated strings to arrays for frontend
    const parsedBusinesses = businesses.map(business => {
      const data = business.toJSON()
      if (data.category && typeof data.category === 'string') {
        data.category = data.category.split(',').map(s => s.trim()).filter(s => s)
      }
      if (data.subcategory && typeof data.subcategory === 'string') {
        data.subcategory = data.subcategory.split(',').map(s => s.trim()).filter(s => s)
      }
      return data
    })
    
    res.json({ businesses: parsedBusinesses })
  } catch (err) {
    console.error('Error fetching businesses:', err)
    res.status(500).json({ message: 'Failed to fetch businesses' })
  }
})

// GET /api/business-directory/:id - Get a single business catalogue entry
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }
    
    // Convert comma-separated strings to arrays for frontend
    const data = business.toJSON()
    if (data.category && typeof data.category === 'string') {
      data.category = data.category.split(',').map(s => s.trim()).filter(s => s)
    }
    if (data.subcategory && typeof data.subcategory === 'string') {
      data.subcategory = data.subcategory.split(',').map(s => s.trim()).filter(s => s)
    }
    
    res.json({ business: data })
  } catch (err) {
    console.error('Error fetching business:', err)
    res.status(500).json({ message: 'Failed to fetch business' })
  }
})

// DELETE /api/business-directory/:id - Delete a business catalogue entry
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    await business.destroy()
    res.status(200).json({ message: 'Business deleted successfully' })
  } catch (err) {
    console.error('Error deleting business:', err)
    res.status(500).json({ message: 'Failed to delete business' })
  }
})

export default router