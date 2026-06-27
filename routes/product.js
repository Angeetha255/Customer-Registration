import express from 'express'
import multer from 'multer'
import path from 'path'
import { authMiddleware } from '../middleware/auth.js'
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

// POST /api/product - Create a new product
router.post('/', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 },
  { name: 'gallery', maxCount: 20 }
]), async (req, res) => {
  try {
    const { 
      companyId, 
      productName, 
      displayPrice, 
      productMrp,
      discountPercentage,
      discountPrice,
      isEnabled,
      specifications,
      descriptions,
      youtubeLink,
      productCategory
    } = req.body

    // Validation
    if (!productName) {
      return res.status(400).json({ message: 'Product Name is required' })
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

    // Parse specifications and descriptions from JSON string if needed
    let parsedSpecs = null
    if (specifications) {
      try {
        parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications
      } catch (e) {
        parsedSpecs = null
      }
    }

    let parsedDescs = null
    if (descriptions) {
      try {
        parsedDescs = typeof descriptions === 'string' ? JSON.parse(descriptions) : descriptions
      } catch (e) {
        parsedDescs = null
      }
    }

    const product = await Product.create({
      companyId: companyId || null,
      coverImage: coverImagePath,
      productImages: productImagePaths,
      gallery: galleryPaths,
      productName,
      displayPrice: displayPrice === 'true' || displayPrice === true,
      productMrp: productMrp || null,
      discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
      discountPrice: finalDiscountPrice,
      isEnabled: isEnabled === 'true' || isEnabled === true,
      specifications: parsedSpecs,
      descriptions: parsedDescs,
      youtubeLink: youtubeLink || null,
      productCategory: productCategory || null,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Product created successfully', product })
  } catch (err) {
    console.error('Error creating product:', err)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

// PUT /api/product/:id - Update a product
router.put('/:id', authMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'productImages', maxCount: 10 },
  { name: 'gallery', maxCount: 20 }
]), async (req, res) => {
  try {
    const { 
      companyId, 
      productName, 
      displayPrice, 
      productMrp,
      discountPercentage,
      discountPrice,
      isEnabled,
      specifications,
      descriptions,
      youtubeLink,
      productCategory
    } = req.body

    // Validation
    if (!productName) {
      return res.status(400).json({ message: 'Product Name is required' })
    }

    const product = await Product.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const coverImagePath = req.files?.coverImage?.[0]?.filename || product.coverImage
    const productImagePaths = req.files?.productImages?.map(file => file.filename) || product.productImages
    const galleryPaths = req.files?.gallery?.map(file => file.filename) || product.gallery

    // Calculate discount price if not provided
    let finalDiscountPrice = discountPrice ? parseFloat(discountPrice) : null
    if (productMrp && discountPercentage && !finalDiscountPrice) {
      const mrp = parseFloat(productMrp)
      const discount = parseFloat(discountPercentage)
      finalDiscountPrice = mrp - (mrp * discount / 100)
    }

    // Parse specifications and descriptions from JSON string if needed
    let parsedSpecs = product.specifications
    if (specifications) {
      try {
        parsedSpecs = typeof specifications === 'string' ? JSON.parse(specifications) : specifications
      } catch (e) {
        parsedSpecs = product.specifications
      }
    }

    let parsedDescs = product.descriptions
    if (descriptions) {
      try {
        parsedDescs = typeof descriptions === 'string' ? JSON.parse(descriptions) : descriptions
      } catch (e) {
        parsedDescs = product.descriptions
      }
    }

    await product.update({
      companyId: companyId || null,
      coverImage: coverImagePath,
      productImages: productImagePaths,
      gallery: galleryPaths,
      productName,
      displayPrice: displayPrice === 'true' || displayPrice === true,
      productMrp: productMrp || null,
      discountPercentage: discountPercentage ? parseFloat(discountPercentage) : 0,
      discountPrice: finalDiscountPrice,
      isEnabled: isEnabled === 'true' || isEnabled === true,
      specifications: parsedSpecs,
      descriptions: parsedDescs,
      youtubeLink: youtubeLink || null,
      productCategory: productCategory || null,
    })

    res.status(200).json({ message: 'Product updated successfully', product })
  } catch (err) {
    console.error('Error updating product:', err)
    res.status(500).json({ message: 'Failed to update product' })
  }
})

// GET /api/product - Get all products for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { createdBy: req.user.id },
      order: [['id', 'DESC']]
    })
    res.json({ products })
  } catch (err) {
    console.error('Error fetching products:', err)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

// GET /api/product/:id - Get a single product
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json({ product })
  } catch (err) {
    console.error('Error fetching product:', err)
    res.status(500).json({ message: 'Failed to fetch product' })
  }
})

// GET /api/product/company/:companyId - Get products for a company
router.get('/company/:companyId', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { companyId: req.params.companyId },
      order: [['id', 'DESC']]
    })
    res.json({ products })
  } catch (err) {
    console.error('Error fetching products:', err)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

// DELETE /api/product/:id - Delete a product
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    await product.destroy()
    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (err) {
    console.error('Error deleting product:', err)
    res.status(500).json({ message: 'Failed to delete product' })
  }
})

export default router