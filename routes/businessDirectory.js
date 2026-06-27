import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Business from '../models/Business.js'
import Company from '../models/Company.js'

const router = express.Router()

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

// GET /api/business-directory - Get all business catalogue entries for the logged-in user
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

// GET /api/business-directory/:id - Get a single business catalogue entry
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