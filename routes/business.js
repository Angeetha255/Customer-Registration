import express from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware } from '../middleware/auth.js'
import Business from '../models/Business.js'
import Product from '../models/Product.js'
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

    const business = await Business.create({
      companyId: companyId || null,
      category,
      subcategory: subcategory || null,
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

    await business.update({
      companyId: companyId || null,
      category,
      subcategory: subcategory || null,
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
    res.json({ businesses })
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
    res.json({ business })
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