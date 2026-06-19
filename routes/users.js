import express from 'express'
import pdfkit from 'pdfkit'
import bcrypt from 'bcrypt'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import User, { HIDDEN_FIELDS } from '../models/User.js'
import Settings from '../models/Settings.js'
import { propagateTeamStats } from '../services/teamStats.js'
import { generateUserId } from '../services/userIdService.js'
import { enrichUserStats } from '../services/userEnrichment.js'
import {
  buildUserLookup,
  buildReferralHierarchyForUser,
  enrichGenealogyMember,
  getDownlineIds,
  getTeamViewRoot,
  getPlacementLevelSummary,
  getPlacementChildren,
  hasPlacementChildren,
  getPlacementLevelUsers,
  getUserLevel,
  buildPlacementTree,
} from '../services/genealogyService.js'

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

// ─── Admin: Database reset & Top ID management ───────────────────────────────────

// POST /api/users/reset-db  — reset all user data and set up Top ID
router.post('/reset-db', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { topUserName, topUserEmail, topUserPhone, topUserPassword } = req.body
    if (!topUserName || !topUserEmail || !topUserPhone || !topUserPassword) {
      return res.status(400).json({ message: 'All Top ID details are required.' })
    }
    if (!/^[0-9]{10}$/.test(String(topUserPhone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }

    // Delete all users
    await User.destroy({ where: {}, truncate: true })

    // Create Top User
    const now = new Date()
    const hashedPassword = await bcrypt.hash(topUserPassword, 10)
    const topUser = await User.create({
      name: topUserName,
      email: topUserEmail,
      phone: topUserPhone,
      regat: now,
      userId: await generateUserId(),
      refid: null,
      placeid: null,
      position: null,
      DOJ: now,
      DOA: now,
      password: hashedPassword,
      refcount: 0,
      refactcount: 0,
      teamcount: 0,
      teamactcount: 0,
      active: true
    })

    // Save Top User ID in settings
    await Settings.findOrCreate({
      where: { key: 'topUserId' },
      defaults: { value: topUser.id.toString() }
    }).then(async ([setting, created]) => {
      if (!created) {
        setting.value = topUser.id.toString()
        await setting.save()
      }
    })

    await propagateTeamStats(topUser.id, null)

    const prefix = await getReferralPrefix()
    const savedTopUser = await User.findByPk(topUser.id, { attributes: { exclude: HIDDEN_FIELDS } })

    res.status(201).json({
      message: 'Database reset successfully. Top ID created.',
      topUser: savedTopUser,
      referralId: toReferralId(prefix, topUser.id),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to reset database.', error: error.message })
  }
})

// PUT /api/users/top-id  — update Top ID details
router.put('/top-id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    if (!topUserIdSetting) {
      return res.status(404).json({ message: 'Top ID not found. Please reset database first.' })
    }

    const topUserId = parseInt(topUserIdSetting.value, 10)
    const topUser = await User.findByPk(topUserId)
    if (!topUser) {
      return res.status(404).json({ message: 'Top user not found.' })
    }

    if (name) topUser.name = name
    if (email) {
      if (email !== topUser.email) {
        const existingUser = await User.findOne({ where: { email, id: { [require('sequelize').Op.ne]: topUserId } } })
        if (existingUser) {
          return res.status(409).json({ message: 'Email is already in use by another account.' })
        }
        topUser.email = email
      }
    }
    if (phone) {
      if (!/^[0-9]{10}$/.test(String(phone))) {
        return res.status(400).json({ message: 'Phone number must be 10 digits.' })
      }
      topUser.phone = phone
    }
    if (password) {
      topUser.password = await bcrypt.hash(password, 10)
    }

    await topUser.save()
    const savedTopUser = await User.findByPk(topUserId, { attributes: { exclude: HIDDEN_FIELDS } })
    res.json({ message: 'Top ID updated.', topUser: savedTopUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to update Top ID.', error: error.message })
  }
})

// GET /api/users/genealogy  — get genealogy tree data (admin)
router.get('/genealogy', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const prefix = await getReferralPrefix()
    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    let tree = null
    if (topUserIdSetting) {
      const topUserId = parseInt(topUserIdSetting.value, 10)
      tree = await buildPlacementTree(topUserId, prefix)
    }
    res.json({ tree })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to load genealogy tree.' })
  }
})

// ─── User profile ─────────────────────────────────────────────────────────────

// GET /api/users/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // /me is a customer endpoint — return admin info directly if admin token
    if (req.userType === 'admin') {
      return res.json({ ...req.user, type: 'admin' })
    }

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
    if (userRecord.refid) {
      const referrer = await User.findByPk(userRecord.refid, { attributes: ['id', 'name'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = toReferralId(prefix, referrer.id)
      }
    }

    // Resolve placement parent name and display id
    let placementParentName = null
    let placementParentDisplayId = null
    if (userRecord.placeid) {
      const placementParent = await User.findByPk(userRecord.placeid, { attributes: ['id', 'name'] })
      if (placementParent) {
        placementParentName = placementParent.name
        placementParentDisplayId = toReferralId(prefix, placementParent.id)
      }
    }

    const referred = await User.findAll({
      where: { refid: userRecord.id },
      attributes: { exclude: HIDDEN_FIELDS },
    })

    const level = await getUserLevel(userRecord.id)

    res.json({
      ...enrichUserStats(userRecord.toJSON()),
      referralId,
      referralLink,
      referrerName,
      referrerDisplayId,
      placementParentName,
      placementParentDisplayId,
      level,
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
    const { name, phone, email } = req.body
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required.' })
    }
    if (!/^[0-9]{10}$/.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }
    const userRecord = await User.findByPk(req.user.id)
    if (!userRecord) return res.status(404).json({ message: 'User not found.' })

    userRecord.name = name
    userRecord.phone = phone

    // Update email if provided and different
    if (email && email !== userRecord.email) {
      const exists = await User.findOne({ where: { email } })
      if (exists) return res.status(409).json({ message: 'Email is already in use by another account.' })
      userRecord.email = email
    }

    await userRecord.save()
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

    // Collect all unique refid ids to batch-fetch referrer names
    const referrerIds = [...new Set(users.map((u) => u.refid).filter(Boolean))]
    const referrers = referrerIds.length
      ? await User.findAll({ where: { id: referrerIds }, attributes: ['id', 'name'] })
      : []
    const referrerMap = Object.fromEntries(referrers.map((r) => [r.id, r.name]))

    const enriched = users.map((u) => ({
      ...enrichUserStats(u.toJSON()),
      referralId: toReferralId(prefix, u.id),
      referrerName: u.refid ? (referrerMap[u.refid] || null) : null,
      referrerDisplayId: u.refid ? toReferralId(prefix, u.refid) : null,
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
    const todayRegistrations = await User.count({ where: { regat: { [Op.gte]: startOfDay } } })

    const prefix = await getReferralPrefix()
    const recentCustomers = await User.findAll({
      order: [['regat', 'DESC']],
      limit: 5,
      attributes: ['id', 'name', 'email', 'phone', 'regat', 'refid'],
    })

    const totalReferrals = (await User.sum('refcount')) || 0
    const topReferrer = await User.findOne({
      order: [['refcount', 'DESC']],
      attributes: ['id', 'name', 'email', 'phone', 'refcount'],
    })

    // Top user = the first registered user (lowest id, no refid) — the tree root
    const topUser = await User.findOne({
      where: { refid: null },
      order: [['id', 'ASC']],
      attributes: ['id', 'name', 'userId'],
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
      topUser: topUser
        ? { id: topUser.id, name: topUser.name, userId: topUser.userId }
        : null,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to load stats.' })
  }
})

// ─── Customer: genealogy pages ────────────────────────────────────────────────

const GENEALOGY_ATTRS = [
  'id', 'name', 'userId', 'refid', 'placeid', 'position',
  'active', 'regat', 'DOJ', 'DOA',
  'refcount', 'refactcount', 'teamcount', 'teamactcount',
]

// GET /api/users/my-direct — direct referrals only
router.get('/my-direct', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const prefix = await getReferralPrefix()
    const direct = await User.findAll({
      where: { refid: req.user.id },
      attributes: GENEALOGY_ATTRS,
      order: [['id', 'ASC']],
    })

    const lookup = await buildUserLookup(direct.map((u) => u.refid))
    const members = direct.map((u) => enrichGenealogyMember(u, lookup, prefix))

    res.json({ members })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch direct referrals.' })
  }
})

// GET /api/users/my-team - referral-only upline + downline hierarchy
router.get('/my-team', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const prefix = await getReferralPrefix()
    const { search = '', page = 1, limit = 10, level } = req.query

    // If level parameter is provided, return placement-level users instead
    if (level) {
      const levelNum = parseInt(level, 10)
      if (isNaN(levelNum) || levelNum < 1) {
        return res.status(400).json({ message: 'Invalid level parameter.' })
      }

      const members = await getPlacementLevelUsers(req.user.id, levelNum, prefix)
      const normalizedSearch = String(search).trim().toLowerCase()
      const filtered = normalizedSearch
        ? members.filter((m) =>
            String(m.userIdDisplay || '').toLowerCase().includes(normalizedSearch)
          )
        : members

      const currentPage = Math.max(parseInt(page, 10) || 1, 1)
      const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100)
      const start = (currentPage - 1) * pageSize

      return res.json({
        members: filtered.slice(start, start + pageSize).map((m) => ({
          ...m,
          level: levelNum,
        })),
        level: levelNum,
        total: filtered.length,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.max(Math.ceil(filtered.length / pageSize), 1),
      })
    }

    const currentPage = Math.max(parseInt(page, 10) || 1, 1)
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100)
    const normalizedSearch = String(search).trim().toLowerCase()

    const { members, tree } = await buildReferralHierarchyForUser(req.user.id, prefix)
    
    // Calculate placement-based level for each member to match Team View
    const membersWithPlacementLevel = await Promise.all(
      members.map(async (member) => ({
        ...member,
        level: await getUserLevel(member.id),
      }))
    )
    
    const filteredMembers = normalizedSearch
      ? membersWithPlacementLevel.filter((member) =>
          String(member.userIdDisplay || '').toLowerCase().includes(normalizedSearch)
        )
      : membersWithPlacementLevel

    const total = filteredMembers.length
    const start = (currentPage - 1) * pageSize

    res.json({
      members: filteredMembers.slice(start, start + pageSize),
      tree,
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch team members.' })
  }
})

// GET /api/users/team-view — placement tree rooted at current user
router.get('/team-view', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const prefix = await getReferralPrefix()
    const tree = await getTeamViewRoot(req.user.id, prefix)
    const levelSummary = await getPlacementLevelSummary(req.user.id, prefix)
    res.json({ tree, levelSummary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to load team view.' })
  }
})

// GET /api/users/team-view/:userId — placement tree for a specific user
router.get('/team-view/:userId', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const targetUserId = parseInt(req.params.userId, 10)
    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'Invalid user ID.' })
    }

    const prefix = await getReferralPrefix()
    const tree = await getTeamViewRoot(targetUserId, prefix)
    const levelSummary = await getPlacementLevelSummary(targetUserId, prefix)
    res.json({ tree, levelSummary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to load team view.' })
  }
})

// GET /api/users/team-view/children/:parentId — lazy-load placement children
router.get('/team-view/children/:parentId', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const parentId = parseInt(req.params.parentId, 10)
    if (isNaN(parentId)) return res.status(400).json({ message: 'Invalid parent ID.' })

    const prefix = await getReferralPrefix()
    const children = await getPlacementChildren(parentId, prefix)

    for (const child of children) {
      child.hasChildren = await hasPlacementChildren(child.id)
    }

    res.json({ children })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to load children.' })
  }
})

// GET /api/users/team-view/search — search by userId in downline placement tree
router.get('/team-view/search', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const { q } = req.query
    if (!q || !String(q).trim()) {
      return res.status(400).json({ message: 'Search query is required.' })
    }

    const prefix = await getReferralPrefix()
    const downlineIds = await getDownlineIds(req.user.id)
    const searchIds = [req.user.id, ...downlineIds]

    const { Op } = await import('sequelize')
    const matches = await User.findAll({
      where: {
        id: searchIds,
        [Op.or]: [
          { userId: { [Op.like]: `%${q}%` } },
          { id: isNaN(parseInt(q, 10)) ? -1 : parseInt(q, 10) },
        ],
      },
      attributes: GENEALOGY_ATTRS,
      limit: 20,
    })

    const lookupIds = matches.flatMap((u) => [u.refid, u.placeid].filter(Boolean))
    const lookup = await buildUserLookup(lookupIds)
    const results = matches.map((u) => enrichGenealogyMember(u, lookup, prefix))

    res.json({ results })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Search failed.' })
  }
})

// ─── Customer: referred list ──────────────────────────────────────────────────

// GET /api/users/referred/list
router.get('/referred/list', authMiddleware, async (req, res) => {
  try {
    const user = req.user
    const referred = await User.findAll({
      where: { refid: user.id },
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
      attributes: ['id', 'name', 'email', 'phone', 'refid', 'regat'],
    })

    // Batch fetch referrer names
    const referrerIds = [...new Set(customers.map((c) => c.refid).filter(Boolean))]
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
          `Referred By: ${customer.refid ? (referrerMap[customer.refid] || 'Unknown') : 'N/A'} (${customer.refid ? toReferralId(prefix, customer.refid) : 'N/A'})`
        )
        doc.text(`Registered At: ${customer.regat.toISOString()}`)
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
          c.refid ? (referrerMap[c.refid] || 'Unknown') : '',
          c.refid ? toReferralId(prefix, c.refid) : '',
          c.regat.toISOString(),
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
    if (customer.refid) {
      const referrer = await User.findByPk(customer.refid, { attributes: ['id', 'name'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = toReferralId(prefix, referrer.id)
      }
    }

    const level = await getUserLevel(customer.id)

    res.json({
      ...customer.toJSON(),
      referralId: toReferralId(prefix, customer.id),
      referrerName,
      referrerDisplayId,
      level,
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

    if (phone && !/^[0-9]{10}$/.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }

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
        // Set DOA when toggling to active; clear it when deactivating
        if (newActive && !customer.DOA) {
          customer.DOA = new Date()
        } else if (!newActive) {
          customer.DOA = null
        }
      }
    }

    await customer.save()

    // Refresh global team stats and refactcount if active status changed
    if (activeChanged) {
      await propagateTeamStats(customer.id, customer.refid || null)
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

    const refId = customer.refid
    await customer.destroy()

    await propagateTeamStats(customer.id, refId || null)

    res.json({ message: 'Customer deleted.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to delete customer.' })
  }
})

export default router
