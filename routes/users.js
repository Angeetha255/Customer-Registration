import express from 'express'
import pdfkit from 'pdfkit'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import User, { HIDDEN_FIELDS } from '../models/User.js'
import Settings from '../models/Settings.js'
import { propagateTeamStats } from '../services/teamStats.js'

const router = express.Router()

// Helper: get referral prefix
const getReferralPrefix = async () => {
  const setting = await Settings.findOne({ where: { key: 'referralPrefix' } })
  return setting ? setting.value : 'REF'
}

// Helper: format a user's referral display id
const toReferralId = (prefix, userId) => `${prefix}${userId}`

// ─── Settings routes (admin only) ────────────────────────────────────────────

// GET /api/users/settings  — fetch all settings
router.get('/settings', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const rows = await Settings.findAll()
    const result = {}
    rows.forEach((r) => { result[r.key] = r.value })
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch settings.' })
  }
})

// PUT /api/users/settings  — upsert a setting by key
router.put('/settings', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { key, value } = req.body
    if (!key || value === undefined) {
      return res.status(400).json({ message: 'key and value are required.' })
    }
    const [row, created] = await Settings.findOrCreate({ where: { key }, defaults: { value } })
    if (!created) {
      row.value = value
      await row.save()
    }
    res.json({ message: 'Setting saved.', key, value })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to save setting.' })
  }
})

// ─── User profile ─────────────────────────────────────────────────────────────

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // Re-fetch from DB to guarantee HIDDEN_FIELDS are excluded
    const userRecord = await User.findByPk(req.user.id, {
      attributes: { exclude: HIDDEN_FIELDS },
    })
    if (!userRecord) return res.status(404).json({ message: 'User not found.' })

    const prefix = await getReferralPrefix()
    const referralLink = `${process.env.FRONTEND_BASE || ''}/register?ref=${userRecord.id}`
    const referralId = toReferralId(prefix, userRecord.id)

    // Resolve referrer name and display id
    let referrerName = null
    let referrerDisplayId = null
    if (userRecord.referredBy) {
      const referrer = await User.findByPk(userRecord.referredBy, { attributes: ['id', 'name'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = toReferralId(prefix, referrer.id)
      }
    }

    const referred = await User.findAll({
      where: { referredBy: userRecord.id },
      attributes: { exclude: HIDDEN_FIELDS },
    })

    res.json({
      ...userRecord.toJSON(),
      referralId,
      referralLink,
      referrerName,
      referrerDisplayId,
      referredCustomers: referred,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch profile.' })
  }
})

// PUT /api/users/me
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, phone } = req.body
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' })
    }
    const userRecord = await User.findByPk(req.user.id)
    userRecord.name = name
    userRecord.phone = phone
    await userRecord.save()
    // Return without hidden fields
    const safe = await User.findByPk(req.user.id, { attributes: { exclude: HIDDEN_FIELDS } })
    res.json({ message: 'Profile updated.', user: safe })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to update profile.' })
  }
})

// ─── Admin: list customers ────────────────────────────────────────────────────

// GET /api/users
router.get('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { search, email, name, phone, page = 1, limit = 10, sort = 'id' } = req.query
    const where = {}
    const { Op } = await import('sequelize')

    if (email) where.email = { [Op.like]: `%${email}%` }
    if (name) where.name = { [Op.like]: `%${name}%` }
    if (phone) where.phone = { [Op.like]: `%${phone}%` }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ]
    }

    const offset = (Number(page) - 1) * Number(limit)
    const { count: total, rows: users } = await User.findAndCountAll({
      where,
      order: [[sort, 'ASC']],
      offset,
      limit: Number(limit),
      attributes: { exclude: HIDDEN_FIELDS },
    })

    const prefix = await getReferralPrefix()

    // Collect all unique referredBy ids to batch-fetch referrer names
    const referrerIds = [...new Set(users.map((u) => u.referredBy).filter(Boolean))]
    const referrers = referrerIds.length
      ? await User.findAll({ where: { id: referrerIds }, attributes: ['id', 'name'] })
      : []
    const referrerMap = Object.fromEntries(referrers.map((r) => [r.id, r.name]))

    const enriched = users.map((u) => ({
      ...u.toJSON(),
      referralId: toReferralId(prefix, u.id),
      referrerName: u.referredBy ? (referrerMap[u.referredBy] || null) : null,
      referrerDisplayId: u.referredBy ? toReferralId(prefix, u.referredBy) : null,
    }))

    res.json({ total, page: Number(page), limit: Number(limit), customers: enriched })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to retrieve customers.' })
  }
})

// ─── Admin: stats ─────────────────────────────────────────────────────────────

// GET /api/users/stats
router.get('/stats', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const totalCustomers = await User.count()
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const { Op } = await import('sequelize')
    const todayRegistrations = await User.count({ where: { registeredAt: { [Op.gte]: startOfDay } } })

    const prefix = await getReferralPrefix()
    const recentCustomers = await User.findAll({
      order: [['registeredAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'email', 'phone', 'registeredAt', 'referredBy'],
    })

    const totalReferrals = (await User.sum('referralCount')) || 0
    const topReferrer = await User.findOne({
      order: [['referralCount', 'DESC']],
      attributes: ['id', 'name', 'email', 'phone', 'referralCount'],
    })

    res.json({
      totalCustomers,
      todayRegistrations,
      recentCustomers: recentCustomers.map((c) => ({
        ...c.toJSON(),
        referralId: toReferralId(prefix, c.id),
      })),
      totalReferrals,
      topReferrer: topReferrer
        ? { ...topReferrer.toJSON(), referralId: toReferralId(prefix, topReferrer.id) }
        : null,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to load stats.' })
  }
})

// ─── Customer: referred list ──────────────────────────────────────────────────

// GET /api/users/referred/list
router.get('/referred/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    const referred = await User.findAll({
      where: { referredBy: user.id },
      attributes: { exclude: HIDDEN_FIELDS },
    })
    res.json({ referred })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch referred customers.' })
  }
})

// ─── Admin: export ────────────────────────────────────────────────────────────

// GET /api/users/export
router.get('/export', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { format = 'csv' } = req.query
    const prefix = await getReferralPrefix()
    const customers = await User.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'referredBy', 'registeredAt'],
    })

    // Batch fetch referrer names
    const referrerIds = [...new Set(customers.map((c) => c.referredBy).filter(Boolean))]
    const referrers = referrerIds.length
      ? await User.findAll({ where: { id: referrerIds }, attributes: ['id', 'name'] })
      : []
    const referrerMap = Object.fromEntries(referrers.map((r) => [r.id, r.name]))

    if (format === 'pdf') {
      const doc = new pdfkit({ size: 'A4', margin: 40 })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=customers.pdf')
      doc.pipe(res)
      doc.fontSize(18).text('Customer Export', { underline: true })
      doc.moveDown()
      customers.forEach((customer) => {
        doc.fontSize(11).text(`Referral ID: ${toReferralId(prefix, customer.id)}`)
        doc.text(`Name: ${customer.name}`)
        doc.text(`Email: ${customer.email}`)
        doc.text(`Phone: ${customer.phone}`)
        doc.text(
          `Referred By: ${customer.referredBy ? (referrerMap[customer.referredBy] || 'Unknown') : 'N/A'} (${customer.referredBy ? toReferralId(prefix, customer.referredBy) : 'N/A'})`
        )
        doc.text(`Registered At: ${customer.registeredAt.toISOString()}`)
        doc.moveDown()
      })
      doc.end()
      return
    }

    const header = 'Referral ID,Name,Email,Phone,Referred By Name,Referred By ID,Registered At\n'
    const rows = customers
      .map((c) =>
        [
          toReferralId(prefix, c.id),
          c.name,
          c.email,
          c.phone,
          c.referredBy ? (referrerMap[c.referredBy] || 'Unknown') : '',
          c.referredBy ? toReferralId(prefix, c.referredBy) : '',
          c.registeredAt.toISOString(),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=customers.csv')
    res.send(header + rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to export customer data.' })
  }
})

// ─── Admin: single customer CRUD ──────────────────────────────────────────────

// GET /api/users/:id
router.get('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findOne({
      where: { id: req.params.id },
      attributes: { exclude: HIDDEN_FIELDS },
    })
    if (!customer) return res.status(404).json({ message: 'Customer not found.' })

    const prefix = await getReferralPrefix()
    let referrerName = null
    let referrerDisplayId = null
    if (customer.referredBy) {
      const referrer = await User.findByPk(customer.referredBy, { attributes: ['id', 'name'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = toReferralId(prefix, referrer.id)
      }
    }

    res.json({
      ...customer.toJSON(),
      referralId: toReferralId(prefix, customer.id),
      referrerName,
      referrerDisplayId,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to retrieve customer.' })
  }
})

// PUT /api/users/:id
router.put('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, active } = req.body
    const customer = await User.findOne({ where: { id: req.params.id } })
    if (!customer) return res.status(404).json({ message: 'Customer not found.' })

    if (email && email !== customer.email) {
      const exists = await User.findOne({ where: { email } })
      if (exists) return res.status(409).json({ message: 'Email already in use.' })
      customer.email = email
    }
    customer.name = name || customer.name
    customer.phone = phone || customer.phone

    let activeChanged = false
    if (typeof active !== 'undefined') {
      const newActive = !!active
      if (newActive !== customer.active) {
        activeChanged = true
        customer.active = newActive
        // Set dateOfActivation when toggling to active; clear it when deactivating
        if (newActive && !customer.dateOfActivation) {
          customer.dateOfActivation = new Date()
        } else if (!newActive) {
          customer.dateOfActivation = null
        }
      }
    }

    await customer.save()

    // Refresh global team stats and referralActiveCount if active status changed
    if (activeChanged) {
      await propagateTeamStats(customer.referredBy || null)
    }

    const safe = await User.findByPk(customer.id, { attributes: { exclude: HIDDEN_FIELDS } })
    res.json({ message: 'Customer updated.', customer: safe })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to update customer.' })
  }
})

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const customer = await User.findOne({ where: { id: req.params.id } })
    if (!customer) return res.status(404).json({ message: 'Customer not found.' })
    await customer.destroy()
    res.json({ message: 'Customer deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to delete customer.' })
  }
})

export default router
