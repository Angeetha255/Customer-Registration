import express from 'express'
import pdfkit from 'pdfkit'
import bcrypt from 'bcrypt'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    const referralLink = user.introducerId ? `${process.env.FRONTEND_BASE || ''}/register?ref=${user.introducerId}` : null
    const referred = user.introducerId ? await User.findAll({ where: { referredBy: user.introducerId }, attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] } }) : []
    res.json({ ...user.toJSON(), referralLink, referredCustomers: referred })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch profile.' })
  }
})

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' })
    }
    req.user.name = name
    req.user.phone = phone
    await req.user.save()
    res.json({ message: 'Profile updated.', user: req.user })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to update profile.' })
  }
})

router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { search, customerId, introducerId, email, name, phone, page = 1, limit = 10, sort = 'registeredAt' } = req.query
    const where = {}
    const { Op } = await import('sequelize')
    if (customerId) where.customerId = customerId
    if (introducerId) where.introducerId = introducerId
    if (email) where.email = { [Op.like]: `%${email}%` }
    if (name) where.name = { [Op.like]: `%${name}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (search) {
      where[Op.or] = [
        { customerId: { [Op.like]: `%${search}%` } },
        { introducerId: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ]
    }
    const offset = (Number(page) - 1) * Number(limit)
    const { count: total, rows: users } = await User.findAndCountAll({ where, order: [[sort, 'DESC']], offset, limit: Number(limit), attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] } })
    res.json({ total, page: Number(page), limit: Number(limit), customers: users })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to retrieve customers.' })
  }
})

router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const totalCustomers = await User.count()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { Op } = await import('sequelize')
    const todayRegistrations = await User.count({ where: { registeredAt: { [Op.gte]: startOfDay } } })
    const recentCustomers = await User.findAll({ order: [['registeredAt', 'DESC']], limit: 5, attributes: ['id', 'name', 'email', 'phone', 'customerId', 'introducerId', 'registeredAt'] })

    const totalReferrals = (await User.sum('referralCount')) || 0
    const topReferrer = await User.findOne({ order: [['referralCount', 'DESC']], attributes: ['name', 'email', 'phone', 'customerId', 'introducerId', 'referralCount'] })

    res.json({ totalCustomers, todayRegistrations, recentCustomers, totalReferrals, topReferrer })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to load stats.' })
  }
})

router.get('/referred/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    if (!user || !user.introducerId) return res.json({ referred: [] })
    const referred = await User.findAll({ where: { referredBy: user.introducerId }, attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] } })
    res.json({ referred })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch referred customers.' })
  }
})

router.get('/export', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query
    const customers = await User.findAll({ attributes: ['name', 'email', 'phone', 'customerId', 'introducerId', 'registeredAt'] })
    if (format === 'pdf') {
      const doc = new pdfkit({ size: 'A4', margin: 40 })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=customers.pdf')
      doc.pipe(res)
      doc.fontSize(18).text('Customer Export', { underline: true })
      doc.moveDown()
      customers.forEach((customer) => {
        doc.fontSize(11).text(`Customer ID: ${customer.customerId}`)
        doc.text(`Name: ${customer.name}`)
        doc.text(`Email: ${customer.email}`)
        doc.text(`Phone: ${customer.phone}`)
        doc.text(`Introducer ID: ${customer.introducerId || 'N/A'}`)
        doc.text(`Registered At: ${customer.registeredAt.toISOString()}`)
        doc.moveDown()
      })
      doc.end()
      return
    }

    const header = 'Customer ID,Name,Email,Phone,Introducer ID,Registered At\n'
    const rows = customers
      .map((customer) => [
        customer.customerId,
        customer.name,
        customer.email,
        customer.phone,
        customer.introducerId || '',
        customer.registeredAt.toISOString(),
      ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(','))
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv')
    res.send(header + rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to export customer data.' })
  }
})

router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findOne({ where: { id: req.params.id }, attributes: { exclude: ['password'] } })
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    res.json(customer)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to retrieve customer.' })
  }
})

router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, introducerId, active } = req.body
    const customer = await User.findOne({ where: { id: req.params.id } })
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    if (email && email !== customer.email) {
      const exists = await User.findOne({ where: { email } })
      if (exists) return res.status(409).json({ message: 'Email already in use.' })
      customer.email = email
    }
    customer.name = name || customer.name
    customer.phone = phone || customer.phone
    if (typeof introducerId !== 'undefined') customer.introducerId = introducerId || null
    if (typeof active !== 'undefined') customer.active = !!active
    await customer.save()
    res.json({ message: 'Customer updated.', customer })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to update customer.' })
  }
})

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findOne({ where: { id: req.params.id } })
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    await customer.destroy()
    res.json({ message: 'Customer deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to delete customer.' })
  }
})

export default router
