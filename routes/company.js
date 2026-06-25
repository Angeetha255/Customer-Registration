import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Company from '../models/Company.js'

const router = express.Router()

// POST /api/company - Create a new company
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      email,
      ownerName,
      website,
      description,
      yearOfEstablishment,
      gstNumber,
      yearlyTurnover,
      numberOfEmployees
    } = req.body

    // Validation
    if (!businessName || !email) {
      return res.status(400).json({ message: 'Business Name and Email are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const company = await Company.create({
      businessName,
      email,
      ownerName: ownerName || null,
      website: website || null,
      description: description || null,
      yearOfEstablishment: yearOfEstablishment ? parseInt(yearOfEstablishment) : null,
      gstNumber: gstNumber || null,
      yearlyTurnover: yearlyTurnover || null,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
      createdBy: req.user.id
    })

    res.status(201).json({ message: 'Company created successfully', company })
  } catch (err) {
    console.error('Error creating company:', err)
    res.status(500).json({ message: 'Failed to create company' })
  }
})

// PUT /api/company/:id - Update a company
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      email,
      ownerName,
      website,
      description,
      yearOfEstablishment,
      gstNumber,
      yearlyTurnover,
      numberOfEmployees
    } = req.body

    // Validation
    if (!businessName || !email) {
      return res.status(400).json({ message: 'Business Name and Email are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    const company = await Company.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    await company.update({
      businessName,
      email,
      ownerName: ownerName || null,
      website: website || null,
      description: description || null,
      yearOfEstablishment: yearOfEstablishment ? parseInt(yearOfEstablishment) : null,
      gstNumber: gstNumber || null,
      yearlyTurnover: yearlyTurnover || null,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
    })

    res.status(200).json({ message: 'Company updated successfully', company })
  } catch (err) {
    console.error('Error updating company:', err)
    res.status(500).json({ message: 'Failed to update company' })
  }
})

// GET /api/company - Get all companies for the logged-in user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { createdBy: req.user.id },
      order: [['id', 'DESC']]
    })
    res.json({ companies })
  } catch (err) {
    console.error('Error fetching companies:', err)
    res.status(500).json({ message: 'Failed to fetch companies' })
  }
})

// GET /api/company/:id - Get a single company
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }
    res.json({ company })
  } catch (err) {
    console.error('Error fetching company:', err)
    res.status(500).json({ message: 'Failed to fetch company' })
  }
})

// DELETE /api/company/:id - Delete a company
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const company = await Company.findOne({
      where: { id: req.params.id, createdBy: req.user.id }
    })
    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    await company.destroy()
    res.status(200).json({ message: 'Company deleted successfully' })
  } catch (err) {
    console.error('Error deleting company:', err)
    res.status(500).json({ message: 'Failed to delete company' })
  }
})

export default router
