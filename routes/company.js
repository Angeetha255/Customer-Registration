import express from 'express'
import { authMiddleware } from '../middleware/auth.js'
import Company from '../models/Company.js'
import Business from '../models/Business.js'
import Product from '../models/Product.js'

const router = express.Router()

// Admin: Get all companies (no user filter)
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const companies = await Company.findAll({
      order: [['id', 'DESC']],
      include: [
        { model: Business, as: 'businesses' },
        { model: Product, as: 'products' }
      ]
    })
    res.json({ companies })
  } catch (err) {
    console.error('Error fetching all companies:', err)
    res.status(500).json({ message: 'Failed to fetch companies' })
  }
})

// POST /api/company - Create a new company
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      businessName,
      email,
      mobileNumber,
      ownerName,
      yearOfEstablishment,
      gstNumber,
      yearlyTurnover,
      numberOfEmployees,
      country,
      state,
      district,
      area,
      pincode,
      mapLink,
      telephoneNumber,
      additionalMobileNumber,
      verify,
      trust,
      quickResponse,
      topRated
    } = req.body

    // Validation
    if (!businessName || !email || !state || !district || !area || !pincode) {
      return res.status(400).json({ message: 'Business Name, Email, State, District, Area, and Pincode are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    if (mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' })
    }

    if (telephoneNumber && !/^[0-9]{10}$/.test(telephoneNumber)) {
      return res.status(400).json({ message: 'Telephone number must be 10 digits' })
    }

    if (additionalMobileNumber && !/^[0-9]{10}$/.test(additionalMobileNumber)) {
      return res.status(400).json({ message: 'Additional mobile number must be 10 digits' })
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' })
    }

    const company = await Company.create({
      businessName,
      email,
      mobileNumber: mobileNumber || null,
      ownerName: ownerName || null,
      yearOfEstablishment: yearOfEstablishment ? parseInt(yearOfEstablishment) : null,
      gstNumber: gstNumber || null,
      yearlyTurnover: yearlyTurnover || null,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
      country: country || 'India',
      state,
      district,
      area,
      pincode,
      mapLink: mapLink || null,
      telephoneNumber: telephoneNumber || null,
      additionalMobileNumber: additionalMobileNumber || null,
      verify: verify ? 1 : 0,
      trust: trust ? 1 : 0,
      quickResponse: quickResponse ? 1 : 0,
      topRated: topRated ? 1 : 0,
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
      mobileNumber,
      ownerName,
      yearOfEstablishment,
      gstNumber,
      yearlyTurnover,
      numberOfEmployees,
      country,
      state,
      district,
      area,
      pincode,
      mapLink,
      telephoneNumber,
      additionalMobileNumber,
      verify,
      trust,
      quickResponse,
      topRated
    } = req.body

    // Validation
    if (!businessName || !email || !state || !district || !area || !pincode) {
      return res.status(400).json({ message: 'Business Name, Email, State, District, Area, and Pincode are required' })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    if (mobileNumber && !/^[0-9]{10}$/.test(mobileNumber)) {
      return res.status(400).json({ message: 'Mobile number must be 10 digits' })
    }

    if (telephoneNumber && !/^[0-9]{10}$/.test(telephoneNumber)) {
      return res.status(400).json({ message: 'Telephone number must be 10 digits' })
    }

    if (additionalMobileNumber && !/^[0-9]{10}$/.test(additionalMobileNumber)) {
      return res.status(400).json({ message: 'Additional mobile number must be 10 digits' })
    }

    if (pincode && !/^[0-9]{6}$/.test(pincode)) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' })
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
      mobileNumber: mobileNumber || null,
      ownerName: ownerName || null,
      yearOfEstablishment: yearOfEstablishment ? parseInt(yearOfEstablishment) : null,
      gstNumber: gstNumber || null,
      yearlyTurnover: yearlyTurnover || null,
      numberOfEmployees: numberOfEmployees ? parseInt(numberOfEmployees) : null,
      country: country || 'India',
      state,
      district,
      area,
      pincode,
      mapLink: mapLink || null,
      telephoneNumber: telephoneNumber || null,
      additionalMobileNumber: additionalMobileNumber || null,
      verify: verify ? 1 : 0,
      trust: trust ? 1 : 0,
      quickResponse: quickResponse ? 1 : 0,
      topRated: topRated ? 1 : 0,
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
      order: [['id', 'DESC']],
      include: [
        { model: Business, as: 'businesses' },
        { model: Product, as: 'products' }
      ]
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
      where: { id: req.params.id, createdBy: req.user.id },
      include: [
        { model: Business, as: 'businesses' },
        { model: Product, as: 'products' }
      ]
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

// Admin: Update any company (for verification)
router.put('/admin/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.type !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    const {
      businessName,
      email,
      mobileNumber,
      ownerName,
      yearOfEstablishment,
      gstNumber,
      yearlyTurnover,
      numberOfEmployees,
      country,
      state,
      district,
      area,
      pincode,
      mapLink,
      telephoneNumber,
      additionalMobileNumber,
      verify,
      trust,
      quickResponse,
      topRated
    } = req.body

    const company = await Company.findOne({
      where: { id: req.params.id }
    })

    if (!company) {
      return res.status(404).json({ message: 'Company not found' })
    }

    await company.update({
      businessName: businessName || company.businessName,
      email: email || company.email,
      mobileNumber: mobileNumber !== undefined ? mobileNumber : company.mobileNumber,
      ownerName: ownerName !== undefined ? ownerName : company.ownerName,
      yearOfEstablishment: yearOfEstablishment !== undefined ? parseInt(yearOfEstablishment) : company.yearOfEstablishment,
      gstNumber: gstNumber !== undefined ? gstNumber : company.gstNumber,
      yearlyTurnover: yearlyTurnover !== undefined ? yearlyTurnover : company.yearlyTurnover,
      numberOfEmployees: numberOfEmployees !== undefined ? parseInt(numberOfEmployees) : company.numberOfEmployees,
      country: country || company.country,
      state: state || company.state,
      district: district || company.district,
      area: area || company.area,
      pincode: pincode || company.pincode,
      mapLink: mapLink !== undefined ? mapLink : company.mapLink,
      telephoneNumber: telephoneNumber !== undefined ? telephoneNumber : company.telephoneNumber,
      additionalMobileNumber: additionalMobileNumber !== undefined ? additionalMobileNumber : company.additionalMobileNumber,
      verify: verify !== undefined ? (verify ? 1 : 0) : company.verify,
      trust: trust !== undefined ? (trust ? 1 : 0) : company.trust,
      quickResponse: quickResponse !== undefined ? (quickResponse ? 1 : 0) : company.quickResponse,
      topRated: topRated !== undefined ? (topRated ? 1 : 0) : company.topRated,
    })

    res.status(200).json({ message: 'Company updated successfully', company })
  } catch (err) {
    console.error('Error updating company:', err)
    res.status(500).json({ message: 'Failed to update company' })
  }
})

export default router
