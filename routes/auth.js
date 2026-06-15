/* global process */
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Counter from '../models/Counter.js'

dotenv.config()

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const JWT_EXPIRES = '7d'

const createUniqueCustomerId = async () => {
  const suffix = Math.floor(10000 + Math.random() * 90000)
  let customerId = `CUST${suffix}`
  while (await User.findOne({ customerId })) {
    const suffix2 = Math.floor(10000 + Math.random() * 90000)
    customerId = `CUST${suffix2}`
  }
  return customerId
}

const getNextIntroducerId = async () => {
  const doc = await Counter.findOneAndUpdate(
    { name: 'introducerId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  )
  const seq = doc.seq || 10001
  return `INT${String(seq).padStart(5, '0')}`
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, referredBy } = req.body
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill all required fields.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' })
    }

    const customerId = await createUniqueCustomerId()
    const introducerId = await getNextIntroducerId()
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      customerId,
      introducerId,
      referredBy: referredBy || null,
      role: 'customer',
      registeredAt: new Date(),
    })
    await user.save()

    // If user was referred, validate and increment referral count on introducer
    if (referredBy) {
      const introducer = await User.findOne({ introducerId: referredBy })
      if (introducer) {
        // prevent self-referral by email match
        if (introducer.email === email) {
          // rollback created user
          await User.deleteOne({ _id: user._id })
          return res.status(400).json({ message: 'You cannot refer yourself.' })
        }
        introducer.referralCount = (introducer.referralCount || 0) + 1
        await introducer.save()
      }
    }

    const saved = await User.findById(user._id).select('-password -resetPasswordToken -resetPasswordExpires')
    res.status(201).json({
      message: 'Customer registered successfully.',
      customerId,
      introducerId: user.introducerId,
      referredBy: user.referredBy,
      user: saved,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Registration failed.', error: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    })
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        customerId: user.customerId,
        introducerId: user.introducerId,
        role: user.role,
        registeredAt: user.registeredAt,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Login failed.' })
  }
})

router.get('/introducer/:id', async (req, res) => {
  try {
    const introducer = await User.findOne({ introducerId: req.params.id, role: 'customer' }).select('name email phone introducerId')
    if (!introducer) return res.status(404).json({ message: 'Introducer not found.' })
    res.json(introducer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Unable to fetch introducer.' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' })
    }
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' })
    }
    const token = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + 1000 * 60 * 60
    await user.save()
    res.json({
      message: 'Password reset token generated.',
      resetToken: token,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to process password reset.' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Token and passwords are required.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' })
    }
    user.password = await bcrypt.hash(password, 10)
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()
    res.json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to reset password.' })
  }
})

export default router
