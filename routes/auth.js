/* global process */
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import User, { HIDDEN_FIELDS } from '../models/User.js'
import Settings from '../models/Settings.js'
import { determinePlacement } from '../services/binaryTree.js'
import { propagateTeamStats } from '../services/teamStats.js'
import { generateUserId } from '../services/userIdService.js'
import { enrichUserStats } from '../services/userEnrichment.js'
import { createLevelRecordsForNewUser } from '../services/levelService.js'
import { sendWelcomeMail } from '../services/mailService.js'

dotenv.config()

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const JWT_EXPIRES = '7d'

// ── GET /api/auth/top-id ───────────────────────────────────────────────────
// Get the current Top ID info (public endpoint to check registration eligibility)
router.get('/top-id', async (req, res) => {
  try {
    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    const topUserId = topUserIdSetting ? parseInt(topUserIdSetting.value, 10) : null
    const topUser = topUserId ? await User.findByPk(topUserId, {
      attributes: ['id', 'name', 'email', 'userId', 'active']
    }) : null
    res.json({ topUserId, topUser })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to get top ID info.' })
  }
})

// ── GET /api/auth/check-referral/:userId ───────────────────────────────────────────
// Check if a referral User ID is valid
router.get('/check-referral/:userId', async (req, res) => {
  try {
    const userIdValue = req.params.userId
    if (!userIdValue || typeof userIdValue !== 'string') {
      return res.status(400).json({ message: 'Invalid User ID.' })
    }

    const referrer = await User.findOne({ where: { userId: userIdValue }, attributes: ['id', 'name', 'email', 'userId', 'active'] })
    if (!referrer) return res.status(404).json({ message: 'Referrer not found.' })

    res.json({ valid: true, referrer: { ...referrer.toJSON(), referralId: referrer.userId } })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Failed to check referral.' })
  }
})

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, referredBy } = req.body
    const refParam = req.query.ref || referredBy

    // Check if Top ID exists (required for registration)
    const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
    if (!topUserIdSetting) {
      return res.status(403).json({ message: 'Registration is not available yet. Contact admin.' })
    }

    // Referral is optional - validate if provided
    let refId = null
    let referrer = null
    if (refParam) {
      // Accept either numeric database ID or generated User ID
      const isNumeric = /^\d+$/.test(String(refParam))
      if (isNumeric) {
        refId = parseInt(refParam, 10)
        referrer = await User.findByPk(refId)
      } else {
        referrer = await User.findOne({ where: { userId: String(refParam) } })
        if (referrer) refId = referrer.id
      }

      if (!referrer) {
        return res.status(400).json({ message: 'Referrer not found. Invalid referral ID.' })
      }
      // Allow registration regardless of referrer's active status
      if (referrer.email === email) {
        return res.status(400).json({ message: 'You cannot refer yourself.' })
      }
    }

    if (!name || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: 'Please fill all required fields.' })
    if (!/^[0-9]{10}$/.test(String(phone)))
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' })

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser)
      return res.status(409).json({ message: 'Email is already registered.' })

    // Binary-tree placement - if no referrer, place under top user or as root
    let placementId = null
    let position = null
    if (refId) {
      const slot = await determinePlacement(refId)
      if (slot) { placementId = slot.parentId; position = slot.position }
    } else {
      // No referrer - place directly under top user if exists
      const topUserIdSetting = await Settings.findOne({ where: { key: 'topUserId' } })
      if (topUserIdSetting) {
        placementId = parseInt(topUserIdSetting.value, 10)
        position = 'left' // Default position for direct referrals to top
      }
    }

    const userId = await generateUserId()
    const now = new Date()
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name, email, phone,
      regat: now,
      userId,
      refid: refId || null,
      placeid: placementId,
      position: position || null,
      DOJ: now,
      DOA: now,
      password: hashedPassword,
      active: false,
    })

    // Update team stats only if there's a referrer
    if (refId) {
      await propagateTeamStats(user.id, refId)
      // Populate levels table for the new user with all ancestor records
      await createLevelRecordsForNewUser(user.id, refId)
    }

    const saved = await User.findByPk(user.id, { attributes: { exclude: HIDDEN_FIELDS } })

    // Send welcome email
    console.log('=== Registration Successful ===')
    console.log('Attempting to send welcome email to:', email)
    try {
      await sendWelcomeMail(email, name, user.userId, userId)
      console.log('Welcome email sent successfully')
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail registration if email fails, just log the error
    }

    res.status(201).json({
      message: 'Customer registered successfully.',
      userId,
      user: enrichUserStats(saved.toJSON()),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Registration failed.', error: error.message })
  }
})

// ── POST /api/auth/login  (customer only) ────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const user = await User.findOne({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' })

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials.' })

    // Token carries type='customer' — no role column involved
    const token = jwt.sign({ type: 'customer', id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES })

    const userData = enrichUserStats({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: 'customer',
      userId: user.userId,
      refid: user.refid,
      active: user.active,
      teamcount: user.teamcount,
      teamactcount: user.teamactcount,
      refcount: user.refcount,
      refactcount: user.refactcount,
      regat: user.regat,
    })

    res.json({ token, user: userData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Login failed.' })
  }
})


// ── POST /api/auth/admin/login  (admin only — separate endpoint) ─────────────
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' })

    const admin = await Admin.findOne({ where: { email } })
    if (!admin) return res.status(401).json({ message: 'Invalid credentials.' })

    const validPassword = await bcrypt.compare(password, admin.password)
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials.' })

    // Token carries type='admin'
    const token = jwt.sign({ type: 'admin', id: admin.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES })

    const userData = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone,
      type: 'admin',
      regat: admin.regat,
    }

    res.json({ token, user: userData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Login failed.' })
  }
})

// ── GET /api/auth/referrer/:userId ────────────────────────────────────────────────
router.get('/referrer/:userId', async (req, res) => {
  try {
    const userIdValue = req.params.userId
    if (!userIdValue || typeof userIdValue !== 'string') {
      return res.status(400).json({ message: 'Invalid User ID.' })
    }
    const referrer = await User.findOne({
      where: { userId: userIdValue },
      attributes: ['id', 'name', 'email', 'phone', 'userId'],
    })
    if (!referrer) return res.status(404).json({ message: 'Referrer not found.' })
    res.json({ ...referrer.toJSON(), referralId: referrer.userId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch referrer.' })
  }
})

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.' })
    let user = await User.findOne({ where: { email } })
    if (!user) user = await Admin.findOne({ where: { email } })
    if (!user)
      return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' })
    const token = crypto.randomBytes(20).toString('hex')
    user.pwdtoken = token
    user.pwdexp = new Date(Date.now() + 1000 * 60 * 60)
    await user.save()
    res.json({ message: 'Password reset token generated.', resetToken: token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to process password reset.' })
  }
})

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body
    if (!token || !password || !confirmPassword)
      return res.status(400).json({ message: 'Token and passwords are required.' })
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' })
    const { Op } = await import('sequelize')
    let user = await User.findOne({
      where: { pwdtoken: token, pwdexp: { [Op.gt]: new Date() } },
    })
    if (!user) {
      user = await Admin.findOne({
        where: { pwdtoken: token, pwdexp: { [Op.gt]: new Date() } },
      })
    }
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' })
    }
    user.password = await bcrypt.hash(password, 10)
    user.pwdtoken = null
    user.pwdexp = null
    await user.save()
    res.json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to reset password.' })
  }
})

export default router
