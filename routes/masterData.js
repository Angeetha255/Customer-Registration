import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import db from '../models/index.js'
import { sequelize, DataTypes } from '../models/sequelize.js'
import { Op } from 'sequelize'

const { Country, State, District, Area, Category, Subcategory } = db

const router = express.Router()

// ==================== COUNTRIES ====================

// Get all countries
router.get('/countries', authMiddleware, async (req, res) => {
  try {
    const countries = await Country.findAll({
      where: { status: 'active' },
      order: [['countryName', 'ASC']]
    })
    res.json({ countries })
  } catch (err) {
    console.error('Error fetching countries:', err)
    res.status(500).json({ message: 'Failed to fetch countries' })
  }
})

// Get all countries with pagination (for admin)
router.get('/countries/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.countryName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Country.findAndCountAll({
      where,
      order: [['countryName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      countries: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching countries:', err)
    res.status(500).json({ message: 'Failed to fetch countries' })
  }
})

// Create country (admin only)
router.post('/countries', authMiddleware, async (req, res) => {
  try {
    const { countryName } = req.body
    if (!countryName) {
      return res.status(400).json({ message: 'Country name is required' })
    }
    const country = await Country.create({ countryName, status: 'active' })
    res.status(201).json({ message: 'Country created successfully', country })
  } catch (err) {
    console.error('Error creating country:', err)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Country already exists' })
    }
    res.status(500).json({ message: 'Failed to create country' })
  }
})

// Update country (admin only)
router.put('/countries/:id', authMiddleware, async (req, res) => {
  try {
    const { countryName, status } = req.body
    const country = await Country.findByPk(req.params.id)
    if (!country) {
      return res.status(404).json({ message: 'Country not found' })
    }
    await country.update({ countryName, status })
    res.json({ message: 'Country updated successfully', country })
  } catch (err) {
    console.error('Error updating country:', err)
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Country already exists' })
    }
    res.status(500).json({ message: 'Failed to update country' })
  }
})

// Delete country (admin only)
router.delete('/countries/:id', authMiddleware, async (req, res) => {
  try {
    const country = await Country.findByPk(req.params.id)
    if (!country) {
      return res.status(404).json({ message: 'Country not found' })
    }
    await country.destroy()
    res.json({ message: 'Country deleted successfully' })
  } catch (err) {
    console.error('Error deleting country:', err)
    res.status(500).json({ message: 'Failed to delete country' })
  }
})

// ==================== STATES ====================

// Get all states
router.get('/states', authMiddleware, async (req, res) => {
  try {
    const states = await State.findAll({
      where: { status: 'active' },
      order: [['stateName', 'ASC']]
    })
    res.json({ states })
  } catch (err) {
    console.error('Error fetching states:', err)
    res.status(500).json({ message: 'Failed to fetch states' })
  }
})

// Get all states with pagination (for admin)
router.get('/states/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.stateName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await State.findAndCountAll({
      where,
      order: [['stateName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      states: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching states:', err)
    res.status(500).json({ message: 'Failed to fetch states' })
  }
})

// Create state (admin only)
router.post('/states', authMiddleware, async (req, res) => {
  try {
    const { stateName } = req.body
    if (!stateName) {
      return res.status(400).json({ message: 'State name is required' })
    }
    const state = await State.create({ stateName, status: 'active' })
    res.status(201).json({ message: 'State created successfully', state })
  } catch (err) {
    console.error('Error creating state:', err)
    res.status(500).json({ message: 'Failed to create state' })
  }
})

// Update state (admin only)
router.put('/states/:id', authMiddleware, async (req, res) => {
  try {
    const { stateName, status } = req.body
    const state = await State.findByPk(req.params.id)
    if (!state) {
      return res.status(404).json({ message: 'State not found' })
    }
    await state.update({ stateName, status })
    res.json({ message: 'State updated successfully', state })
  } catch (err) {
    console.error('Error updating state:', err)
    res.status(500).json({ message: 'Failed to update state' })
  }
})

// Delete state (admin only)
router.delete('/states/:id', authMiddleware, async (req, res) => {
  try {
    const state = await State.findByPk(req.params.id)
    if (!state) {
      return res.status(404).json({ message: 'State not found' })
    }
    await state.destroy()
    res.json({ message: 'State deleted successfully' })
  } catch (err) {
    console.error('Error deleting state:', err)
    res.status(500).json({ message: 'Failed to delete state' })
  }
})

// ==================== DISTRICTS ====================

// Get districts by state
router.get('/districts', authMiddleware, async (req, res) => {
  try {
    const { stateId } = req.query
    const where = { status: 'active' }
    if (stateId) where.stateId = stateId
    const districts = await District.findAll({
      where,
      order: [['districtName', 'ASC']]
    })
    res.json({ districts })
  } catch (err) {
    console.error('Error fetching districts:', err)
    res.status(500).json({ message: 'Failed to fetch districts' })
  }
})

// Get all districts with pagination (for admin)
router.get('/districts/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.districtName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await District.findAndCountAll({
      where,
      include: [{ model: State, as: 'state', attributes: ['id', 'stateName'] }],
      order: [['districtName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      districts: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching districts:', err)
    res.status(500).json({ message: 'Failed to fetch districts' })
  }
})

// Create district (admin only)
router.post('/districts', authMiddleware, async (req, res) => {
  try {
    const { stateId, districtName } = req.body
    if (!stateId || !districtName) {
      return res.status(400).json({ message: 'State ID and district name are required' })
    }
    const district = await District.create({ stateId, districtName, status: 'active' })
    res.status(201).json({ message: 'District created successfully', district })
  } catch (err) {
    console.error('Error creating district:', err)
    res.status(500).json({ message: 'Failed to create district' })
  }
})

// Update district (admin only)
router.put('/districts/:id', authMiddleware, async (req, res) => {
  try {
    const { districtName, status } = req.body
    const district = await District.findByPk(req.params.id)
    if (!district) {
      return res.status(404).json({ message: 'District not found' })
    }
    await district.update({ districtName, status })
    res.json({ message: 'District updated successfully', district })
  } catch (err) {
    console.error('Error updating district:', err)
    res.status(500).json({ message: 'Failed to update district' })
  }
})

// Delete district (admin only)
router.delete('/districts/:id', authMiddleware, async (req, res) => {
  try {
    const district = await District.findByPk(req.params.id)
    if (!district) {
      return res.status(404).json({ message: 'District not found' })
    }
    await district.destroy()
    res.json({ message: 'District deleted successfully' })
  } catch (err) {
    console.error('Error deleting district:', err)
    res.status(500).json({ message: 'Failed to delete district' })
  }
})

// ==================== AREAS ====================

// Get areas by district
router.get('/areas', authMiddleware, async (req, res) => {
  try {
    const { districtId } = req.query
    const where = { status: 'active' }
    if (districtId) where.districtId = districtId
    const areas = await Area.findAll({
      where,
      order: [['areaName', 'ASC']]
    })
    res.json({ areas })
  } catch (err) {
    console.error('Error fetching areas:', err)
    res.status(500).json({ message: 'Failed to fetch areas' })
  }
})

// Get all areas with pagination (for admin)
router.get('/areas/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.areaName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Area.findAndCountAll({
      where,
      include: [
        { model: District, as: 'district', attributes: ['id', 'districtName'], include: [{ model: State, as: 'state', attributes: ['id', 'stateName'] }] }
      ],
      order: [['areaName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      areas: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching areas:', err)
    res.status(500).json({ message: 'Failed to fetch areas' })
  }
})

// Create area (admin only)
router.post('/areas', authMiddleware, async (req, res) => {
  try {
    const { districtId, areaName } = req.body
    if (!districtId || !areaName) {
      return res.status(400).json({ message: 'District ID and area name are required' })
    }
    const area = await Area.create({ districtId, areaName, status: 'active' })
    res.status(201).json({ message: 'Area created successfully', area })
  } catch (err) {
    console.error('Error creating area:', err)
    res.status(500).json({ message: 'Failed to create area' })
  }
})

// Update area (admin only)
router.put('/areas/:id', authMiddleware, async (req, res) => {
  try {
    const { areaName, status } = req.body
    const area = await Area.findByPk(req.params.id)
    if (!area) {
      return res.status(404).json({ message: 'Area not found' })
    }
    await area.update({ areaName, status })
    res.json({ message: 'Area updated successfully', area })
  } catch (err) {
    console.error('Error updating area:', err)
    res.status(500).json({ message: 'Failed to update area' })
  }
})

// Delete area (admin only)
router.delete('/areas/:id', authMiddleware, async (req, res) => {
  try {
    const area = await Area.findByPk(req.params.id)
    if (!area) {
      return res.status(404).json({ message: 'Area not found' })
    }
    await area.destroy()
    res.json({ message: 'Area deleted successfully' })
  } catch (err) {
    console.error('Error deleting area:', err)
    res.status(500).json({ message: 'Failed to delete area' })
  }
})

// ==================== CATEGORIES ====================

// Get all categories
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      order: [['categoryName', 'ASC']]
    })
    res.json({ categories })
  } catch (err) {
    console.error('Error fetching categories:', err)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

// Get all categories with pagination (for admin)
router.get('/categories/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.categoryName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [['categoryName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      categories: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching categories:', err)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

// Create category (admin only)
router.post('/categories', authMiddleware, async (req, res) => {
  try {
    const { categoryName } = req.body
    if (!categoryName) {
      return res.status(400).json({ message: 'Category name is required' })
    }
    const category = await Category.create({ categoryName, status: 'active' })
    res.status(201).json({ message: 'Category created successfully', category })
  } catch (err) {
    console.error('Error creating category:', err)
    res.status(500).json({ message: 'Failed to create category' })
  }
})

// Update category (admin only)
router.put('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const { categoryName, status } = req.body
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    await category.update({ categoryName, status })
    res.json({ message: 'Category updated successfully', category })
  } catch (err) {
    console.error('Error updating category:', err)
    res.status(500).json({ message: 'Failed to update category' })
  }
})

// Delete category (admin only)
router.delete('/categories/:id', authMiddleware, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    await category.destroy()
    res.json({ message: 'Category deleted successfully' })
  } catch (err) {
    console.error('Error deleting category:', err)
    res.status(500).json({ message: 'Failed to delete category' })
  }
})

// ==================== SUBCATEGORIES ====================

// Get subcategories by category
router.get('/subcategories', authMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.query
    const where = { status: 'active' }
    if (categoryId) where.categoryId = categoryId
    const subcategories = await Subcategory.findAll({
      where,
      order: [['subcategoryName', 'ASC']]
    })
    res.json({ subcategories })
  } catch (err) {
    console.error('Error fetching subcategories:', err)
    res.status(500).json({ message: 'Failed to fetch subcategories' })
  }
})

// Get all subcategories with pagination (for admin)
router.get('/subcategories/all', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query
    const offset = (page - 1) * limit

    const where = {}
    if (search) {
      where.subcategoryName = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Subcategory.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category', attributes: ['id', 'categoryName'] }],
      order: [['subcategoryName', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json({
      subcategories: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })
  } catch (err) {
    console.error('Error fetching subcategories:', err)
    res.status(500).json({ message: 'Failed to fetch subcategories' })
  }
})

// Create subcategory (admin only)
router.post('/subcategories', authMiddleware, async (req, res) => {
  try {
    const { categoryId, subcategoryName } = req.body
    if (!categoryId || !subcategoryName) {
      return res.status(400).json({ message: 'Category ID and subcategory name are required' })
    }
    const subcategory = await Subcategory.create({ categoryId, subcategoryName, status: 'active' })
    res.status(201).json({ message: 'Subcategory created successfully', subcategory })
  } catch (err) {
    console.error('Error creating subcategory:', err)
    res.status(500).json({ message: 'Failed to create subcategory' })
  }
})

// Update subcategory (admin only)
router.put('/subcategories/:id', authMiddleware, async (req, res) => {
  try {
    const { subcategoryName, status } = req.body
    const subcategory = await Subcategory.findByPk(req.params.id)
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' })
    }
    await subcategory.update({ subcategoryName, status })
    res.json({ message: 'Subcategory updated successfully', subcategory })
  } catch (err) {
    console.error('Error updating subcategory:', err)
    res.status(500).json({ message: 'Failed to update subcategory' })
  }
})

// Delete subcategory (admin only)
router.delete('/subcategories/:id', authMiddleware, async (req, res) => {
  try {
    const subcategory = await Subcategory.findByPk(req.params.id)
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' })
    }
    await subcategory.destroy()
    res.json({ message: 'Subcategory deleted successfully' })
  } catch (err) {
    console.error('Error deleting subcategory:', err)
    res.status(500).json({ message: 'Failed to delete subcategory' })
  }
})

export default router