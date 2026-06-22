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
  getPlacementChildren,
  hasPlacementChildren,
  buildPlacementTree,
  getUserLevel,
} from '../services/genealogyService.js'

import { getLevelSummary, getLevelUsers, deleteLevelRecordsForJoiner, deleteLevelRecordsForSponsor } from '../services/levelService.js'

const router = express.Router()

// GET /api/users/level-summary — level summary from levels table
router.get('/level-summary', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    // Use userId from query param if provided, otherwise use logged-in user
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : req.user.id
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID.' })
    }

    const summary = await getLevelSummary(userId)
    res.json({ summary })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch level summary.' })
  }
})

// GET /api/users/level-users/:level — users at a specific level from levels table
router.get('/level-users/:level', authMiddleware, async (req, res) => {
  try {
    if (req.userType === 'admin') {
      return res.status(403).json({ message: 'Customer access only.' })
    }

    const level = parseInt(req.params.level, 10)
    if (isNaN(level) || level < 1) {
      return res.status(400).json({ message: 'Invalid level.' })
    }

    // Use userId from query param if provided, otherwise use logged-in user
    const userId = req.query.userId ? parseInt(req.query.userId, 10) : req.user.id
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID.' })
    }

    const users = await getLevelUsers(userId, level)
    res.json({ users })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch level users.' })
  }
})

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

    const savedTopUser = await User.findByPk(topUser.id, { attributes: { exclude: HIDDEN_FIELDS } })

    res.status(201).json({
      message: 'Database reset successfully. Top ID created.',
      topUser: savedTopUser,
      referralId: topUser.userId,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to reset database.', error: error.message })
  }
})

// POST /api/users/top-id  — set Top ID from existing user
router.post('/top-id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required.' })
    }

    const selectedUser = await User.findByPk(userId, { attributes: { exclude: HIDDEN_FIELDS } })
    if (!selectedUser) {
      return res.status(404).json({ message: 'Selected user not found.' })
    }

    // Save Top User ID in settings
    await Settings.findOrCreate({
      where: { key: 'topUserId' },
      defaults: { value: userId.toString() }
    }).then(async ([setting, created]) => {
      if (!created) {
        setting.value = userId.toString()
        await setting.save()
      }
    })

    await propagateTeamStats(userId, selectedUser.refid)

    res.json({
      message: 'Top ID set successfully.',
      topUser: {
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        userId: selectedUser.userId,
        referralId: selectedUser.userId,
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to set Top ID.', error: error.message })
  }
})

// POST /api/users/create-first-top-id  — create first user as Top ID (when no users exist)
router.post('/create-first-top-id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }
    if (!/^[0-9]{10}$/.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' })
    }

    const now = new Date()
    const hashedPassword = await bcrypt.hash(password, 10)
    const topUser = await User.create({
      name,
      email,
      phone,
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

    const savedTopUser = await User.findByPk(topUser.id, { attributes: { exclude: HIDDEN_FIELDS } })

    res.status(201).json({
      message: 'Top ID created successfully.',
      topUser: {
        id: savedTopUser.id,
        name: savedTopUser.name,
        email: savedTopUser.email,
        userId: savedTopUser.userId,
        referralId: savedTopUser.userId,
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to create Top ID.', error: error.message })
  }
})

// PUT /api/users/top-id  — update Top ID details
router.put('/top-id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, password } = req.body

    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    if (!topUserIdSetting) {
      return res.status(404).json({ message: 'Top ID not found. Please set Top ID first.' })
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
    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    let tree = null
    if (topUserIdSetting) {
      const topUserId = parseInt(topUserIdSetting.value, 10)
      tree = await buildPlacementTree(topUserId)
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

    const referralLink = `${process.env.FRONTEND_BASE || ''}/register?ref=${userRecord.id}`

    // Resolve referrer name and display id
    let referrerName = null
    let referrerDisplayId = null
    let referrerReferralId = null
    if (userRecord.refid) {
      const referrer = await User.findByPk(userRecord.refid, { attributes: ['id', 'name', 'userId'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = referrer.userId || String(referrer.id)
        referrerReferralId = referrer.userId || String(referrer.id)
      }
    }

    // Resolve placement parent name and display id
    let placementParentName = null
    let placementParentDisplayId = null
    if (userRecord.placeid) {
      const placementParent = await User.findByPk(userRecord.placeid, { attributes: ['id', 'name'] })
      if (placementParent) {
        placementParentName = placementParent.name
        placementParentDisplayId = placementParent.userId || String(placementParent.id)
      }
    }

    const referred = await User.findAll({
      where: { refid: userRecord.id },
      attributes: { exclude: HIDDEN_FIELDS },
    })

    const level = await getUserLevel(userRecord.id)

    res.json({
      ...enrichUserStats(userRecord.toJSON()),
      userId: userRecord.userId,
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

    // Collect all unique refid ids to batch-fetch referrer names and user IDs
    const referrerIds = [...new Set(users.map((u) => u.refid).filter(Boolean))]
    const referrers = referrerIds.length
      ? await User.findAll({ where: { id: referrerIds }, attributes: ['id', 'name', 'userId'] })
      : []
    const referrerMap = Object.fromEntries(referrers.map((r) => [r.id, { name: r.name, userId: r.userId }]))

    const enriched = users.map((u) => {
      const referrer = u.refid ? referrerMap[u.refid] : null
      return {
        ...enrichUserStats(u.toJSON()),
        userId: u.userId,
        referrerName: referrer ? referrer.name : null,
        referrerUserId: referrer ? referrer.userId : null,
        referrerDisplayId: u.refid ? (referrer ? (referrer.userId || `#${u.refid}`) : `#${u.refid}`) : null,
      }
    })

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
        referralId: c.userId,
      })),
      totalReferrals,
      topReferrer: topReferrer
        ? { ...topReferrer.toJSON(), referralId: topReferrer.userId }
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

    const direct = await User.findAll({
      where: { refid: req.user.id },
      attributes: GENEALOGY_ATTRS,
      order: [['id', 'ASC']],
    })

    const lookup = await buildUserLookup(direct.map((u) => u.refid))
    const members = direct.map((u) => enrichGenealogyMember(u, lookup))

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

    const { search = '', page = 1, limit = 10, level } = req.query

    // If level parameter is provided, return placement-level users instead
    if (level) {
      const levelNum = parseInt(level, 10)
      if (isNaN(levelNum) || levelNum < 1) {
        return res.status(400).json({ message: 'Invalid level parameter.' })
      }

      const members = await getPlacementLevelUsers(req.user.id, levelNum)
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

    const { members, tree } = await buildReferralHierarchyForUser(req.user.id)
    
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

    const tree = await getTeamViewRoot(req.user.id)
    const levelSummary = await getPlacementLevelSummary(req.user.id)
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

    const tree = await getTeamViewRoot(targetUserId)
    const levelSummary = await getPlacementLevelSummary(targetUserId)
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

    const children = await getPlacementChildren(parentId)

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
    const results = matches.map((u) => enrichGenealogyMember(u, lookup))

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
    const customers = await User.findAll({
      attributes: ['id', 'userId', 'name', 'email', 'phone', 'refid', 'regat'],
    })

    // Ensure all customers have a userId; generate and save if missing
    const missingUserId = customers.filter((c) => !c.userId)
    if (missingUserId.length > 0) {
      for (const customer of missingUserId) {
        customer.userId = await generateUserId()
        await customer.save()
      }
    }

    // Batch fetch referrer names and user IDs
    const referrerIds = [...new Set(customers.map((c) => c.refid).filter(Boolean))]
    const referrers = referrerIds.length
      ? await User.findAll({ where: { id: referrerIds }, attributes: ['id', 'name', 'userId'] })
      : []
    const referrerMap = Object.fromEntries(referrers.map((r) => [r.id, { name: r.name, userId: r.userId }]))

    if (format === 'pdf') {
      const doc = new pdfkit({ size: 'A4', margin: 40 })
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', 'attachment; filename=customers.pdf')
      doc.pipe(res)
      doc.fontSize(18).text('Customer Export', { underline: true })
      doc.moveDown()
      customers.forEach((customer) => {
        doc.fontSize(11).text(`User ID: ${customer.userId}`)
        doc.text(`Name: ${customer.name}`)
        doc.text(`Email: ${customer.email}`)
        doc.text(`Phone: ${customer.phone}`)
        const referrerInfo = customer.refid ? (referrerMap[customer.refid] || { name: 'Unknown', userId: 'N/A' }) : { name: 'N/A', userId: 'N/A' }
        doc.text(`Referred By: ${referrerInfo.name} (${referrerInfo.userId})`)
        doc.text(`Registered At: ${customer.regat.toISOString()}`)
        doc.moveDown()
      })
      doc.end()
      return
    }

    const header = 'User ID,Name,Email,Phone,Referred By Name,Referred By User ID,Registered At\n'
    const rows = customers
      .map((c) => {
        const referrerInfo = c.refid ? (referrerMap[c.refid] || { name: 'Unknown', userId: 'N/A' }) : { name: '', userId: '' }
        return [
          c.userId,
          c.name,
          c.email,
          c.phone,
          referrerInfo.name,
          referrerInfo.userId,
          c.regat.toISOString(),
        ]
      })
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
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

    let referrerName = null
    let referrerDisplayId = null
    if (customer.refid) {
      const referrer = await User.findByPk(customer.refid, { attributes: ['id', 'name'] })
      if (referrer) {
        referrerName = referrer.name
        referrerDisplayId = referrer.userId || String(referrer.id)
      }
    }

    const level = await getUserLevel(customer.id)

    res.json({
      ...customer.toJSON(),
      userId: customer.userId,
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
    const userId = customer.id

    // Clean up level records before deleting the user
    await deleteLevelRecordsForJoiner(userId)
    await deleteLevelRecordsForSponsor(userId)

    await customer.destroy()

    await propagateTeamStats(userId, refId)

    res.json({ message: 'Customer deleted.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to delete customer.' })
  }
})

export default router