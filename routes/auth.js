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

dotenv.config()

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const JWT_EXPIRES = '7d'

const getReferralPrefix = async () => {
  const setting = await Settings.findOne({ where: { key: 'referralPrefix' } })
  return setting ? setting.value : 'REF'
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body
    const refParam = req.query.ref || req.body.referredBy

    if (!name || !email || !phone || !password || !confirmPassword)
      return res.status(400).json({ message: 'Please fill all required fields.' })
    if (!/^[0-9]{10}$/.test(String(phone)))
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match.' })

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser)
      return res.status(409).json({ message: 'Email is already registered.' })

    let referrerId = null
    if (refParam) {
      const refId = parseInt(refParam, 10)
      if (!isNaN(refId)) {
        const referrer = await User.findByPk(refId)
        if (referrer) {
          if (referrer.email === email)
            return res.status(400).json({ message: 'You cannot refer yourself.' })
          referrerId = refId
        }
      }
    }

    // Binary-tree placement
    let placementId = null
    let position = null
    const slot = await determinePlacement(referrerId)
    if (slot) { placementId = slot.parentId; position = slot.position }

    const userId = await generateUserId()
    const now = new Date()
    const hashedPassword = await bcrypt.hash(password, 10)

    // Determine topId: Only the very first user in the system has topId = own id
    const firstUser = await User.findOne({ order: [['id', 'ASC']] })
    let topId = null
    if (!firstUser) {
      // This is the first user
      topId = null // We'll set it after create to user.id
    }
    // All other users have topId = null

    const user = await User.create({
      name, email, phone,
      regat: now,
      userId,
      refid: referrerId,
      placeid: placementId,
      position,
      DOJ: now,
      DOA: now,
      password: hashedPassword,
    })

    // If this is the first user, set topId = own id (topId removed? Wait user didn't list topId in columns, let's check user's request again... Oh user didn't include topId in final column order, okay.)

    if (referrerId) {
      const referrer = await User.findByPk(referrerId)
      if (referrer) {
        referrer.refcount = (referrer.refcount || 0) + 1
        await referrer.save()
      }
    }

    await propagateTeamStats(user.id, referrerId)

    const prefix = await getReferralPrefix()
    const saved = await User.findByPk(user.id, { attributes: { exclude: HIDDEN_FIELDS } })

    res.status(201).json({
      message: 'Customer registered successfully.',
      referralId: `${prefix}${user.id}`,
      userId,
      user: saved,
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

    const prefix = await getReferralPrefix()
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      type: 'customer',
      userId: user.userId,
      refid: user.refid,
      refcount: user.refcount,
      referralId: `${prefix}${user.id}`,
      active: user.active,
      teamcount: user.teamcount,
      teamactcount: user.teamactcount,
      regat: user.regat,
    }

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

// ── GET /api/auth/referrer/:id ────────────────────────────────────────────────
router.get('/referrer/:id', async (req, res) => {
  try {
    const refId = parseInt(req.params.id, 10)
    if (isNaN(refId)) return res.status(400).json({ message: 'Invalid referrer ID.' })
    const referrer = await User.findByPk(refId, {
      attributes: ['id', 'name', 'email', 'phone', 'userId'],
    })
    if (!referrer) return res.status(404).json({ message: 'Referrer not found.' })
    const prefix = await getReferralPrefix()
    res.json({ ...referrer.toJSON(), referralId: `${prefix}${referrer.id}` })
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
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' })
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
