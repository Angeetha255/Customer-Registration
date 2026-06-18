import express from 'express'
import pdfkit from 'pdfkit'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import User from '../models/User.js'

const router = express.Router()

router.get('/me', authMiddleware, async (req, res) => {
  res.json(req.user)
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
    const query = { role: 'customer' }
    if (customerId) query.customerId = customerId
    if (introducerId) query.introducerId = introducerId
    if (email) query.email = new RegExp(email, 'i')
    if (name) query.name = new RegExp(name, 'i')
    if (phone) query.phone = new RegExp(phone, 'i')
    if (search) {
      query.$or = [
        { customerId: new RegExp(search, 'i') },
        { introducerId: new RegExp(search, 'i') },
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ]
    }
    const skip = (Number(page) - 1) * Number(limit)
    const total = await User.countDocuments(query)
    const customers = await User.find(query)
      .sort({ [sort]: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-password -resetPasswordToken -resetPasswordExpires')
    res.json({ total, page: Number(page), limit: Number(limit), customers })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to retrieve customers.' })
  }
})

router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const totalCustomers = await User.countDocuments({ role: 'customer' })
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayRegistrations = await User.countDocuments({ role: 'customer', registeredAt: { $gte: startOfDay } })
    const recentCustomers = await User.find({ role: 'customer' })
      .sort({ registeredAt: -1 })
      .limit(5)
      .select('name email phone customerId introducerId registeredAt')

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 6)
    weekAgo.setHours(0, 0, 0, 0)
    const growth = []
    for (let offset = 0; offset < 7; offset += 1) {
      const day = new Date(weekAgo)
      day.setDate(weekAgo.getDate() + offset)
      const nextDay = new Date(day)
      nextDay.setDate(day.getDate() + 1)
      const count = await User.countDocuments({
        role: 'customer',
        registeredAt: { $gte: day, $lt: nextDay },
      })
      growth.push({ date: day.toISOString().slice(0, 10), count })
    }

    res.json({ totalCustomers, todayRegistrations, recentCustomers, growth })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to load stats.' })
  }
})

router.get('/export', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query
    const customers = await User.find({ role: 'customer' }).select('name email phone customerId introducerId registeredAt')
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
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' }).select('-password')
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
    const { name, email, phone } = req.body
    const customer = await User.findOne({ _id: req.params.id, role: 'customer' })
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    customer.name = name || customer.name
    customer.email = email || customer.email
    customer.phone = phone || customer.phone
    await customer.save()
    res.json({ message: 'Customer updated.', customer })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to update customer.' })
  }
})

router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findOneAndDelete({ _id: req.params.id, role: 'customer' })
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found.' })
    }
    res.json({ message: 'Customer deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to delete customer.' })
  }
})

router.get('/referred/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    if (!user || !user.introducerId) return res.json({ referred: [] })
    const referred = await User.find({ referredBy: user.introducerId }).select('-password -resetPasswordToken -resetPasswordExpires')
    res.json({ referred })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch referred customers.' })
  }
})

export default router
