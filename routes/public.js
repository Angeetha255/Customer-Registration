import express from 'express'
import Company from '../models/Company.js'
import Business from '../models/Business.js'
import Product from '../models/Product.js'
import Country from '../models/Country.js'
import State from '../models/State.js'
import District from '../models/District.js'
import Area from '../models/Area.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import ProductSpecification from '../models/ProductSpecification.js'
import ProductDescription from '../models/ProductDescription.js'

const router = express.Router()

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// ==================== COMPANIES ====================

// GET /api/public/companies - Get all companies
router.get('/companies', asyncHandler(async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['id', 'DESC']]
    })
    res.json({ companies })
  } catch (err) {
    console.error('Error fetching companies:', err)
    res.status(500).json({ message: 'Failed to fetch companies' })
  }
}))

// GET /api/public/companies/:id - Get a single company with related data
router.get('/companies/:id', asyncHandler(async (req, res) => {
  try {
    const company = await Company.findOne({
      where: { id: req.params.id }
    })
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }
    
    // Fetch related data separately
    const businesses = await Business.findAll({ where: { companyId: company.id } })
    const products = await Product.findAll({ where: { companyId: company.id } })
    
    res.json({ 
      company,
      businesses,
      products
    })
  } catch (err) {
    console.error('Error fetching company:', err)
    res.status(500).json({ message: 'Failed to fetch company' })
  }
}))

// ==================== BUSINESSES ====================

// GET /api/public/businesses - Get all businesses
router.get('/businesses', asyncHandler(async (req, res) => {
  try {
    const businesses = await Business.findAll({
      order: [['id', 'DESC']],
      include: [
        { 
          model: Company, 
          as: 'company',
          include: [
            { model: Business, as: 'businesses' },
            { model: Product, as: 'products' }
          ]
        }
      ]
    })
    res.json({ businesses })
  } catch (err) {
    console.error('Error fetching businesses:', err)
    res.status(500).json({ message: 'Failed to fetch businesses' })
  }
}))

// GET /api/public/businesses/:id - Get a single business with related data
router.get('/businesses/:id', asyncHandler(async (req, res) => {
  try {
    const business = await Business.findOne({
      where: { id: req.params.id },
      include: [
        { 
          model: Company, 
          as: 'company',
          include: [
            { model: Business, as: 'businesses' },
            { model: Product, as: 'products' }
          ]
        }
      ]
    })
    
    if (!business) {
      return res.status(404).json({ message: 'Business not found' })
    }
    
    res.json({ business })
  } catch (err) {
    console.error('Error fetching business:', err)
    res.status(500).json({ message: 'Failed to fetch business' })
  }
}))

// GET /api/public/businesses/:id/products - Get products for a specific business
router.get('/businesses/:id/products', asyncHandler(async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { businessId: req.params.id },
      order: [['id', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          include: [
            { model: Business, as: 'businesses' },
            { model: Product, as: 'products' }
          ]
        }
      ]
    })
    res.json({ products })
  } catch (err) {
    console.error('Error fetching business products:', err)
    res.status(500).json({ message: 'Failed to fetch business products' })
  }
}))

// ==================== PRODUCTS ====================

// GET /api/public/products - Get all products
router.get('/products', asyncHandler(async (req, res) => {
  try {
    const products = await Product.findAll({
      order: [['id', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company'
        }
      ]
    })
    res.json({ products })
  } catch (err) {
    console.error('Error fetching products:', err)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
}))

// GET /api/public/products/:id - Get a single product with full details
router.get('/products/:id', asyncHandler(async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Company,
          as: 'company'
        }
      ]
    })
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    
    // Fetch specifications and descriptions separately
    const specifications = await ProductSpecification.findAll({ 
      where: { productId: product.id },
      order: [['id', 'ASC']]
    })
    const descriptions = await ProductDescription.findAll({ 
      where: { productId: product.id },
      order: [['displayOrder', 'ASC']]
    })
    
    res.json({ 
      product,
      specifications,
      descriptions
    })
  } catch (err) {
    console.error('Error fetching product:', err)
    res.status(500).json({ message: 'Failed to fetch product' })
  }
}))

// GET /api/public/products/:id/specifications - Get specifications for a product
router.get('/products/:id/specifications', asyncHandler(async (req, res) => {
  try {
    const specifications = await ProductSpecification.findAll({
      where: { productId: req.params.id },
      order: [['id', 'ASC']]
    })
    res.json({ specifications })
  } catch (err) {
    console.error('Error fetching product specifications:', err)
    res.status(500).json({ message: 'Failed to fetch product specifications' })
  }
}))

// GET /api/public/products/:id/descriptions - Get descriptions for a product
router.get('/products/:id/descriptions', asyncHandler(async (req, res) => {
  try {
    const descriptions = await ProductDescription.findAll({
      where: { productId: req.params.id },
      order: [['displayOrder', 'ASC']]
    })
    res.json({ descriptions })
  } catch (err) {
    console.error('Error fetching product descriptions:', err)
    res.status(500).json({ message: 'Failed to fetch product descriptions' })
  }
}))

// ==================== CATEGORIES ====================

// GET /api/public/categories - Get all active categories
router.get('/categories', asyncHandler(async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['categoryName', 'ASC']],
      include: [
        {
          model: Subcategory,
          as: 'subcategories',
          where: { status: 'active' },
          required: false
        }
      ]
    })

    // Process categories to include bannerImages array
    const categoriesWithBanners = categories.map(category => {
      const categoryData = category.toJSON()

      // Build bannerImages array from both sources
      let bannerImages = []

      // If bannerImages exists and is an array, use it
      if (categoryData.bannerImages && Array.isArray(categoryData.bannerImages) && categoryData.bannerImages.length > 0) {
        bannerImages = [...categoryData.bannerImages]
      }
      // If only bannerImage exists, add it to the array
      else if (categoryData.bannerImage) {
        bannerImages = [categoryData.bannerImage]
      }

      // Return category with bannerImages array
      return {
        ...categoryData,
        bannerImages
      }
    })

    res.json({ categories: categoriesWithBanners })
  } catch (err) {
    console.error('Error fetching categories:', err)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}))

// GET /api/public/categories/:id - Get a single category with subcategories
router.get('/categories/:id', asyncHandler(async (req, res) => {
  try {
    const category = await Category.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: Subcategory,
          as: 'subcategories',
          where: { status: 'active' },
          required: false
        }
      ]
    })

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    const categoryData = category.toJSON()

    // Build bannerImages array from both sources
    let bannerImages = []

    // If bannerImages exists and is an array, use it
    if (categoryData.bannerImages && Array.isArray(categoryData.bannerImages) && categoryData.bannerImages.length > 0) {
      bannerImages = [...categoryData.bannerImages]
    }
    // If only bannerImage exists, add it to the array
    else if (categoryData.bannerImage) {
      bannerImages = [categoryData.bannerImage]
    }

    // Return category with bannerImages array
    res.json({
      category: {
        ...categoryData,
        bannerImages
      }
    })
  } catch (err) {
    console.error('Error fetching category:', err)
    res.status(500).json({ message: 'Failed to fetch category' })
  }
}))

// ==================== SUBCATEGORIES ====================

// GET /api/public/subcategories - Get all active subcategories (optionally filtered by categoryId)
router.get('/subcategories', asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.query
    const where = { status: 'active' }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    const subcategories = await Subcategory.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ],
      order: [['subcategoryName', 'ASC']]
    })
    
    res.json({ subcategories })
  } catch (err) {
    console.error('Error fetching subcategories:', err)
    res.status(500).json({ message: 'Failed to fetch subcategories' })
  }
}))

// GET /api/public/subcategories/:id - Get a single subcategory
router.get('/subcategories/:id', asyncHandler(async (req, res) => {
  try {
    const subcategory = await Subcategory.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ]
    })
    
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' })
    }
    
    res.json({ subcategory })
  } catch (err) {
    console.error('Error fetching subcategory:', err)
    res.status(500).json({ message: 'Failed to fetch subcategory' })
  }
}))

// ==================== COUNTRIES ====================

// GET /api/public/countries - Get all active countries
router.get('/countries', asyncHandler(async (req, res) => {
  try {
    const countries = await Country.findAll({
      where: { status: 'active' },
      order: [['countryName', 'ASC']],
      include: [
        {
          model: State,
          as: 'states',
          where: { status: 'active' },
          required: false
        }
      ]
    })
    res.json({ countries })
  } catch (err) {
    console.error('Error fetching countries:', err)
    res.status(500).json({ message: 'Failed to fetch countries' })
  }
}))

// GET /api/public/countries/:id - Get a single country with states
router.get('/countries/:id', asyncHandler(async (req, res) => {
  try {
    const country = await Country.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: State,
          as: 'states',
          where: { status: 'active' },
          required: false
        }
      ]
    })
    
    if (!country) {
      return res.status(404).json({ message: 'Country not found' })
    }
    
    res.json({ country })
  } catch (err) {
    console.error('Error fetching country:', err)
    res.status(500).json({ message: 'Failed to fetch country' })
  }
}))

// ==================== STATES ====================

// GET /api/public/states - Get all active states (optionally filtered by countryId)
router.get('/states', asyncHandler(async (req, res) => {
  try {
    const { countryId } = req.query
    const where = { status: 'active' }
    
    if (countryId) {
      where.countryId = countryId
    }
    
    const states = await State.findAll({
      where,
      include: [
        {
          model: Country,
          as: 'country',
          attributes: ['id', 'countryName']
        }
      ],
      order: [['stateName', 'ASC']]
    })
    
    res.json({ states })
  } catch (err) {
    console.error('Error fetching states:', err)
    res.status(500).json({ message: 'Failed to fetch states' })
  }
}))

// GET /api/public/states/:id - Get a single state with districts
router.get('/states/:id', asyncHandler(async (req, res) => {
  try {
    const state = await State.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: Country,
          as: 'country',
          attributes: ['id', 'countryName']
        },
        {
          model: District,
          as: 'districts',
          where: { status: 'active' },
          required: false
        }
      ]
    })
    
    if (!state) {
      return res.status(404).json({ message: 'State not found' })
    }
    
    res.json({ state })
  } catch (err) {
    console.error('Error fetching state:', err)
    res.status(500).json({ message: 'Failed to fetch state' })
  }
}))

// ==================== DISTRICTS ====================

// GET /api/public/districts - Get all active districts (optionally filtered by stateId)
router.get('/districts', asyncHandler(async (req, res) => {
  try {
    const { stateId } = req.query
    const where = { status: 'active' }
    
    if (stateId) {
      where.stateId = stateId
    }
    
    const districts = await District.findAll({
      where,
      include: [
        {
          model: State,
          as: 'state',
          include: [
            {
              model: Country,
              as: 'country',
              attributes: ['id', 'countryName']
            }
          ]
        }
      ],
      order: [['districtName', 'ASC']]
    })
    
    res.json({ districts })
  } catch (err) {
    console.error('Error fetching districts:', err)
    res.status(500).json({ message: 'Failed to fetch districts' })
  }
}))

// GET /api/public/districts/:id - Get a single district with areas
router.get('/districts/:id', asyncHandler(async (req, res) => {
  try {
    const district = await District.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: State,
          as: 'state',
          include: [
            {
              model: Country,
              as: 'country',
              attributes: ['id', 'countryName']
            }
          ]
        },
        {
          model: Area,
          as: 'areas',
          where: { status: 'active' },
          required: false
        }
      ]
    })
    
    if (!district) {
      return res.status(404).json({ message: 'District not found' })
    }
    
    res.json({ district })
  } catch (err) {
    console.error('Error fetching district:', err)
    res.status(500).json({ message: 'Failed to fetch district' })
  }
}))

// ==================== AREAS ====================

// GET /api/public/areas - Get all active areas (optionally filtered by districtId)
router.get('/areas', asyncHandler(async (req, res) => {
  try {
    const { districtId } = req.query
    const where = { status: 'active' }
    
    if (districtId) {
      where.districtId = districtId
    }
    
    const areas = await Area.findAll({
      where,
      include: [
        {
          model: District,
          as: 'district',
          include: [
            {
              model: State,
              as: 'state',
              include: [
                {
                  model: Country,
                  as: 'country',
                  attributes: ['id', 'countryName']
                }
              ]
            }
          ]
        }
      ],
      order: [['areaName', 'ASC']]
    })
    
    res.json({ areas })
  } catch (err) {
    console.error('Error fetching areas:', err)
    res.status(500).json({ message: 'Failed to fetch areas' })
  }
}))

// GET /api/public/areas/:id - Get a single area
router.get('/areas/:id', asyncHandler(async (req, res) => {
  try {
    const area = await Area.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: District,
          as: 'district',
          include: [
            {
              model: State,
              as: 'state',
              include: [
                {
                  model: Country,
                  as: 'country',
                  attributes: ['id', 'countryName']
                }
              ]
            }
          ]
        }
      ]
    })
    
    if (!area) {
      return res.status(404).json({ message: 'Area not found' })
    }
    
    res.json({ area })
  } catch (err) {
    console.error('Error fetching area:', err)
    res.status(500).json({ message: 'Failed to fetch area' })
  }
}))

// ==================== MASTER DATA ENDPOINTS ====================

// GET /api/public/master-data/categories - Get all categories (alias for backward compatibility)
router.get('/master-data/categories', asyncHandler(async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['categoryName', 'ASC']],
      include: [
        {
          model: Subcategory,
          as: 'subcategories',
          where: { status: 'active' },
          required: false
        }
      ]
    })

    // Process categories to include bannerImages array
    const categoriesWithBanners = categories.map(category => {
      const categoryData = category.toJSON()
      let bannerImages = []

      if (categoryData.bannerImages && Array.isArray(categoryData.bannerImages) && categoryData.bannerImages.length > 0) {
        bannerImages = [...categoryData.bannerImages]
      } else if (categoryData.bannerImage) {
        bannerImages = [categoryData.bannerImage]
      }

      return {
        ...categoryData,
        bannerImages
      }
    })

    res.json({ categories: categoriesWithBanners })
  } catch (err) {
    console.error('Error fetching categories:', err)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
}))

// GET /api/public/master-data/subcategories - Get all subcategories (alias for backward compatibility)
router.get('/master-data/subcategories', asyncHandler(async (req, res) => {
  try {
    const { categoryId } = req.query
    const where = { status: 'active' }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    const subcategories = await Subcategory.findAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'categoryName']
        }
      ],
      order: [['subcategoryName', 'ASC']]
    })
    
    res.json({ subcategories })
  } catch (err) {
    console.error('Error fetching subcategories:', err)
    res.status(500).json({ message: 'Failed to fetch subcategories' })
  }
}))

// GET /api/public/master-data/locations - Get hierarchical location data (Country > State > District > Area)
router.get('/master-data/locations', asyncHandler(async (req, res) => {
  try {
    const countries = await Country.findAll({
      where: { status: 'active' },
      order: [['countryName', 'ASC']],
      include: [
        {
          model: State,
          as: 'states',
          where: { status: 'active' },
          required: false,
          include: [
            {
              model: District,
              as: 'districts',
              where: { status: 'active' },
              required: false,
              include: [
                {
                  model: Area,
                  as: 'areas',
                  where: { status: 'active' },
                  required: false
                }
              ]
            }
          ]
        }
      ]
    })
    
    res.json({ countries })
  } catch (err) {
    console.error('Error fetching location hierarchy:', err)
    res.status(500).json({ message: 'Failed to fetch location hierarchy' })
  }
}))

// ==================== SEARCH ENDPOINTS ====================

// GET /api/public/search/companies - Search companies by name
router.get('/search/companies', asyncHandler(async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' })
    }
    
    const companies = await Company.findAll({
      where: {
        businessName: {
          [require('sequelize').Op.like]: `%${q}%`
        }
      },
      order: [['id', 'DESC']],
      include: [
        { model: Business, as: 'businesses' },
        { model: Product, as: 'products' }
      ]
    })
    
    res.json({ companies })
  } catch (err) {
    console.error('Error searching companies:', err)
    res.status(500).json({ message: 'Failed to search companies' })
  }
}))

// GET /api/public/search/businesses - Search businesses by category or description
router.get('/search/businesses', asyncHandler(async (req, res) => {
  try {
    const { q, category, subcategory } = req.query
    const where = {}
    
    if (q) {
      where[require('sequelize').Op.or] = [
        { category: { [require('sequelize').Op.like]: `%${q}%` } },
        { description: { [require('sequelize').Op.like]: `%${q}%` } }
      ]
    }
    
    if (category) {
      where.category = category
    }
    
    if (subcategory) {
      where.subcategory = subcategory
    }
    
    const businesses = await Business.findAll({
      where,
      order: [['id', 'DESC']],
      include: [
        { 
          model: Company, 
          as: 'company',
          include: [
            { model: Business, as: 'businesses' },
            { model: Product, as: 'products' }
          ]
        }
      ]
    })
    
    res.json({ businesses })
  } catch (err) {
    console.error('Error searching businesses:', err)
    res.status(500).json({ message: 'Failed to search businesses' })
  }
}))

// GET /api/public/search/products - Search products by name
router.get('/search/products', asyncHandler(async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' })
    }
    
    const products = await Product.findAll({
      where: {
        productName: {
          [require('sequelize').Op.like]: `%${q}%`
        }
      },
      order: [['id', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          include: [
            { model: Business, as: 'businesses' },
            { model: Product, as: 'products' }
          ]
        }
      ]
    })
    
    res.json({ products })
  } catch (err) {
    console.error('Error searching products:', err)
    res.status(500).json({ message: 'Failed to search products' })
  }
}))

// ==================== HEALTH CHECK ====================

// GET /api/public/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Public API is running',
    timestamp: new Date().toISOString()
  })
})



// ==================== REVIEWS ====================

import Review from '../models/Review.js'
import { Op } from 'sequelize'

// Input validation helper
function validateReviewInput({ userName, userEmail, rating, comment }) {
  const errors = []
  if (!userName || typeof userName !== 'string' || userName.trim().length < 1)
    errors.push('userName is required')
  if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail.trim()))
    errors.push('A valid userEmail is required')
  if (!rating || isNaN(rating) || Number(rating) < 1 || Number(rating) > 5)
    errors.push('rating must be an integer between 1 and 5')
  if (!comment || typeof comment !== 'string' || comment.trim().length < 1)
    errors.push('comment is required')
  return errors
}

// GET /api/public/reviews/company/:companyId
// IMPORTANT: specific routes MUST come before /reviews/:id to avoid param collision
router.get('/reviews/company/:companyId', asyncHandler(async (req, res) => {
  try {
    const companyId = parseInt(req.params.companyId)
    if (isNaN(companyId)) return res.status(400).json({ message: 'Invalid company ID' })

    const company = await Company.findByPk(companyId)
    if (!company) return res.status(404).json({ message: 'Company not found' })

    const reviews = await Review.findAll({
      where: { company_id: companyId, product_id: null, isVerified: true },
      order: [['created_at', 'DESC']],
    })

    res.json(reviews)
  } catch (err) {
    console.error('Error fetching company reviews:', err)
    res.status(500).json({ message: 'Failed to fetch company reviews' })
  }
}))

// GET /api/public/reviews/product/:productId
router.get('/reviews/product/:productId', asyncHandler(async (req, res) => {
  try {
    const productId = parseInt(req.params.productId)
    if (isNaN(productId)) return res.status(400).json({ message: 'Invalid product ID' })

    const product = await Product.findByPk(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    const reviews = await Review.findAll({
      where: { product_id: productId, isVerified: true },
      order: [['created_at', 'DESC']],
    })

    res.json(reviews)
  } catch (err) {
    console.error('Error fetching product reviews:', err)
    res.status(500).json({ message: 'Failed to fetch product reviews' })
  }
}))

// GET /api/public/reviews - All verified reviews (paginated)
router.get('/reviews', asyncHandler(async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page)  || 1)
    const limit  = Math.min(100, parseInt(req.query.limit) || 20)
    const offset = (page - 1) * limit

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { isVerified: true },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    })

    res.json({
      reviews,
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
    })
  } catch (err) {
    console.error('Error fetching reviews:', err)
    res.status(500).json({ message: 'Failed to fetch reviews' })
  }
}))

// GET /api/public/reviews/:id - Single review by ID
router.get('/reviews/:id', asyncHandler(async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })
    res.json(review)
  } catch (err) {
    console.error('Error fetching review:', err)
    res.status(500).json({ message: 'Failed to fetch review' })
  }
}))

// POST /api/public/reviews - Submit a verified review
router.post('/reviews', asyncHandler(async (req, res) => {
  try {
    const {
      businessId, productId,
      userName, userEmail,
      rating, comment,
      userAvatar,
    } = req.body

    if (!businessId && !productId) {
      return res.status(400).json({ message: 'Either businessId or productId is required' })
    }

    const errors = validateReviewInput({ userName, userEmail, rating, comment })
    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const companyId = businessId ? parseInt(businessId) : null
    const prodId    = productId  ? parseInt(productId)  : null

    if (companyId) {
      const company = await Company.findByPk(companyId)
      if (!company) return res.status(404).json({ message: 'Company not found' })
    }
    if (prodId) {
      const product = await Product.findByPk(prodId)
      if (!product) return res.status(404).json({ message: 'Product not found' })
    }

    // Prevent duplicate from same email within 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const dupWhere = {
      user_email: userEmail.trim().toLowerCase(),
      created_at: { [Op.gte]: oneDayAgo },
    }
    if (companyId) dupWhere.company_id = companyId
    if (prodId)    dupWhere.product_id  = prodId

    const existing = await Review.findOne({ where: dupWhere })
    if (existing) {
      return res.status(409).json({
        message: 'You have already submitted a review for this listing in the last 24 hours.',
      })
    }

    const review = await Review.create({
      company_id: companyId,
      product_id: prodId,
      userName:   userName.trim(),
      userEmail:  userEmail.trim().toLowerCase(),
      rating:     parseInt(rating),
      comment:    comment.trim(),
      isVerified: true,
      userAvatar: userAvatar || null,
    })

    res.status(201).json({
      id:        review.id,
      userName:  review.userName,
      userEmail: review.userEmail,
      rating:    review.rating,
      comment:   review.comment,
      createdAt: review.createdAt,
    })
  } catch (err) {
    console.error('Error creating review:', err)
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: err.errors.map((e) => e.message),
      })
    }
    res.status(500).json({ message: 'Failed to create review' })
  }
}))

// DELETE /api/public/reviews/:id
router.delete('/reviews/:id', asyncHandler(async (req, res) => {
  try {
    const review = await Review.findByPk(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })
    await review.destroy()
    res.json({ message: 'Review deleted successfully' })
  } catch (err) {
    console.error('Error deleting review:', err)
    res.status(500).json({ message: 'Failed to delete review' })
  }
}))

export default router

