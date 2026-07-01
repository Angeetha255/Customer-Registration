import express from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware } from '../middleware/auth.js'
import Business from '../models/Business.js'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import { Op } from 'sequelize'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

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

// POST /api/business-directory - Create a new business directory entry
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
    if (!category) {
      return res.status(400).json({ message: 'Category is required' })
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

// PUT /api/business-directory/:id - Update a business directory entry
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
    if (!category) {
      return res.status(400).json({ message: 'Category is required' })
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

// GET /api/business-directory - Get all business directories
router.get('/', authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.findAll({
      where: { createdBy: req.user.id },
      include: ['company'],
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

// GET /api/business-directory/:id - Get a single business directory entry
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({
      where: { id: req.params.id, createdBy: req.user.id },
      include: ['company']
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

// DELETE /api/business-directory/:id - Delete a business directory entry
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

// POST /api/business/products - Create a new product
router.post('/products', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 },
  { name: 'gallery', maxCount: 20 }
]), async (req, res) => {
  try {
    const { businessId, productName, displayPrice, productMrp, discountPercentage, discountPrice, isEnabled } = req.body

    // Validation
    if (!businessId || !productName) {
      return res.status(400).json({ message: 'Business ID and Product Name are required' })
    }

    // Check if business exists
    const business = await Business.findByPk(businessId)
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }

    const coverImagePath = req.files?.coverImage?.[0]?.filename || null
    const productImagePaths = req.files?.productImages?.map(file => file.filename) || []
    const galleryPaths = req.files?.gallery?.map(file => file.filename) || []

    // Calculate discount price if not provided
    let finalDiscountPrice = discountPrice ? parseFloat(discountPrice) : null
    if (productMrp && discountPercentage && !finalDiscountPrice) {
      const mrp = parseFloat(productMrp)
      const discount = parseFloat(discountPercentage)
      finalDiscountPrice = mrp - (mrp * discount / 100)
    }

    const product = await Product.create({
      businessId,
      coverImage: coverImagePath,
      productImages: productImagePaths,
      gallery: galleryPaths,
      productName,
      displayPrice: displayPrice === 'true' || displayPrice === true,
      productMrp: productMrp || null,
      discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
      discountPrice: finalDiscountPrice,
      isEnabled: isEnabled === 'true' || isEnabled === true,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Product created successfully', product })
  } catch (err) {
    console.error('Error creating product:', err)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

// GET /api/business/:id/products - Get products for a business
router.get('/:id/products', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { businessId: req.params.id },
      order: [['id', 'DESC']]
    })
    res.json({ products })
  } catch (err) {
    console.error('Error fetching products:', err)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

export default router