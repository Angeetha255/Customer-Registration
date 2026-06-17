/* global process */
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import User, { HIDDEN_FIELDS } from '../models/User.js'
import Settings from '../models/Settings.js'
import { findPlacement, determinePlacement } from '../services/binaryTree.js'

dotenv.config()

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const JWT_EXPIRES = '7d'

// Helper: get current referral prefix from settings (default: "REF")
const getReferralPrefix = async () => {
  const setting = await Settings.findOne({ where: { key: 'referralPrefix' } })
  return setting ? setting.value : 'REF'
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body
    // Referral ref is the referrer's numeric primary key id
    const refParam = req.query.ref || req.body.referredBy

    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill all required fields.' })
    }
    if (!/^[0-9]{10}$/.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }

    const existingUser = await User.findOne({ where: { email } })
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' })
    }

    // Resolve referredBy: must be a valid numeric user id
    let referredById = null
    if (refParam) {
      const refId = parseInt(refParam, 10)
      if (!isNaN(refId)) {
        const referrer = await User.findByPk(refId)
        if (referrer) {
          if (referrer.email === email) {
            return res.status(400).json({ message: 'You cannot refer yourself.' })
          }
          referredById = refId
        }
      }
    }

    // ── Binary-tree auto-placement ────────────────────────────────────────
    // Always place every user — referred users start BFS from referrer,
    // non-referred users start BFS from the global tree root.
    let placementId = null
    let position = null
    const slot = await determinePlacement(referredById)
    if (slot) {
      placementId = slot.parentId
      position = slot.position
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      referredBy: referredById,
      placementId,
      position,
      registeredAt: new Date(),
    })

    // Increment referral count on referrer
    if (referredById) {
      const referrer = await User.findByPk(referredById)
      if (referrer) {
        referrer.referralCount = (referrer.referralCount || 0) + 1
        await referrer.save()
      }
    }

    const prefix = await getReferralPrefix()
    const saved = await User.findByPk(user.id, {
      attributes: { exclude: HIDDEN_FIELDS },
    })

    res.status(201).json({
      message: 'Customer registered successfully.',
      referralId: `${prefix}${user.id}`,
      user: saved,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Registration failed.', error: error.message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const isAdminLogin = req.query.admin === '1' || req.body?.admin === true
    let user = null
    let role = 'customer'

    if (isAdminLogin) {
      user = await Admin.findOne({ where: { email } })
      role = 'admin'
      if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
    } else {
      user = await User.findOne({ where: { email } })
      if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
      if (user.role === 'admin') {
        return res.status(401).json({ message: 'Admin accounts must sign in via the admin login page.' })
      }
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials.' })

    const token = jwt.sign({ id: user.id, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES })

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role,
      registeredAt: user.registeredAt,
    }

    if (role === 'customer') {
      const prefix = await getReferralPrefix()
      userData.referredBy = user.referredBy
      userData.referralCount = user.referralCount
      userData.referralId = `${prefix}${user.id}`
    }

    // placementId and position are intentionally excluded from the response
    res.json({ token, user: userData })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Login failed.' })
  }
})

// GET /api/auth/referrer/:id  — look up a referrer by their primary key
router.get('/referrer/:id', async (req, res) => {
  try {
    const refId = parseInt(req.params.id, 10)
    if (isNaN(refId)) return res.status(400).json({ message: 'Invalid referrer ID.' })

    const referrer = await User.findByPk(refId, {
      attributes: ['id', 'name', 'email', 'phone'],
    })
    if (!referrer) return res.status(404).json({ message: 'Referrer not found.' })

    const prefix = await getReferralPrefix()
    res.json({ ...referrer.toJSON(), referralId: `${prefix}${referrer.id}` })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch referrer.' })
  }
})

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required.' })

    let user = await User.findOne({ where: { email } })
    if (!user) user = await Admin.findOne({ where: { email } })
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' })
    }

    const token = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60)
    await user.save()

    res.json({ message: 'Password reset token generated.', resetToken: token })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to process password reset.' })
  }
})

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Token and passwords are required.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }

    const { Op } = await import('sequelize')
    let user = await User.findOne({
      where: { resetPasswordToken: token, resetPasswordExpires: { [Op.gt]: new Date() } },
    })
    if (!user) {
      user = await Admin.findOne({
        where: { resetPasswordToken: token, resetPasswordExpires: { [Op.gt]: new Date() } },
      })
    }
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset token.' })

    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await user.save()

    res.json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to reset password.' })
  }
})

export default router
