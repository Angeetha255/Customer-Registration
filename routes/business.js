import express from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware } from '../middleware/auth.js'
import Business from '../models/Business.js'
import Product from '../models/Product.js'

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

// POST /api/business - Create a new business
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      email,
      mobileNumber,
      website,
      description,
      yearOfEstablishment,
      mapLocation,
      country,
      state,
      district,
      area,
      pincode,
      mainCategory,
      subCategory,
      businessHours,
      numberOfEmployees,
      yearlyTurnover
    } = req.body

    // Validation
    if (!businessName || !email || !mobileNumber || !state || !district || !area || !pincode || !mainCategory) {
      return res.status(400).json({ message: 'Required fields are missing' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    if (!/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' })
    }

    if (!/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' })
    }

    const business = await Business.create({
      businessName,
      email,
      mobileNumber,
      website,
      description,
      yearOfEstablishment,
      mapLocation,
      country: country || 'India',
      state,
      district,
      area,
      pincode,
      mainCategory,
      subCategory,
      businessHours,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
      yearlyTurnover: yearlyTurnover || null,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Business created successfully', business })
  } catch (err) {
    console.error('Error creating business:', err)
    res.status(500).json({ message: 'Failed to create business' })
  }
})

// POST /api/business/products - Create a new product
router.post('/products', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 },
  { name: 'gallery', maxCount: 20 }
]), async (req, res) => {
  try {
    const { businessId, productName, displayPrice, productPrice } = req.body

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

    const product = await Product.create({
      businessId,
      coverImage: coverImagePath,
      productImages: productImagePaths,
      gallery: galleryPaths,
      productName,
      displayPrice: displayPrice === 'true' || displayPrice === true,
      productPrice: displayPrice ? productPrice : null,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Product created successfully', product })
  } catch (err) {
    console.error('Error creating product:', err)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

// GET /api/business - Get all businesses (for future use)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const businesses = await Business.findAll({
      where: { createdBy: req.user.id },
      order: [['id', 'DESC']]
    })
    res.json({ businesses })
  } catch (err) {
    console.error('Error fetching businesses:', err)
    res.status(500).json({ message: 'Failed to fetch businesses' })
  }
})

// GET /api/business/:id - Get a single business (for future use)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const business = await Business.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
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

// GET /api/business/:id/products - Get products for a business (for future use)
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
