/* global process */
import express from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import User from '../models/User.js'
import Counter from '../models/Counter.js'

dotenv.config()

const router = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'
const JWT_EXPIRES = '7d'

const createUniqueCustomerId = async () => {
  const suffix = Math.floor(10000 + Math.random() * 90000)
  let customerId = `CUST${suffix}`
  while (await User.findOne({ where: { customerId } })) {
    const suffix2 = Math.floor(10000 + Math.random() * 90000)
    customerId = `CUST${suffix2}`
  }
  return customerId
}

const getNextIntroducerId = async () => {
  let doc = await Counter.findOne({ where: { name: 'introducerId' } })
  if (!doc) {
    doc = await Counter.create({ name: 'introducerId', seq: 10001 })
    return `INT${String(doc.seq).padStart(5, '0')}`
  }
  doc.seq = (doc.seq || 10000) + 1
  await doc.save()
  const seq = doc.seq
  return `INT${String(seq).padStart(5, '0')}`
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body
    // support referral via query param (?ref=INT12345) or body.referredBy
    const referredBy = req.query.ref || req.body.referredBy
    if (!name || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Please fill all required fields.' })
    }
    // validate phone number: must be exactly 10 digits
    if (!/^[0-9]{10}$/.test(String(phone))) {
      return res.status(400).json({ message: 'Phone number must be 10 digits.' })
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }
    const existingCustomer = await User.findOne({ where: { email } })
    if (existingCustomer) {
      return res.status(409).json({ message: 'Email is already registered.' })
    }

    const customerId = await createUniqueCustomerId()
    const introducerId = await getNextIntroducerId()
    const hashedPassword = await bcrypt.hash(password, 10)
    // Use Model.create to ensure sequelize handles the instance correctly
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      customerId,
      introducerId,
      referredBy: referredBy || null,
      registeredAt: new Date(),
    })
    // Debug: ensure password was saved as a bcrypt hash (length ~60)

    // If user was referred, validate and increment referral count on introducer
    if (referredBy) {
      const introducer = await User.findOne({ where: { introducerId: referredBy } })
      if (introducer) {
        // prevent self-referral by email match
        if (introducer.email === email) {
          // rollback created user
          await user.destroy()
          return res.status(400).json({ message: 'You cannot refer yourself.' })
        }
        introducer.referralCount = (introducer.referralCount || 0) + 1
        await introducer.save()
      }
    }

    const saved = await User.findByPk(user.id, { attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires'] } })
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
    
    const isAdminLogin = req.query.admin === '1' || req.body?.admin === true

    let user = null
    let role = 'customer'

    if (isAdminLogin) {
      // Admin login must use Admin table
      user = await Admin.findOne({ where: { email } })
      role = 'admin'
      if (!user) return res.status(401).json({ message: 'Invalid credentials.' })
    } else {
      // Customer login must use User table only
      user = await User.findOne({ where: { email } })
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' })
      }
      // If the user record is an admin, require admin login
      if (user.role === 'admin') {
        return res.status(401).json({ message: 'Admin accounts must sign in via the admin login page.' })
      }
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) return res.status(401).json({ message: 'Invalid credentials.' })
    
    const token = jwt.sign({ id: user.id, role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES,
    })
    
    // Prepare user data based on role
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role,
      registeredAt: user.registeredAt,
    }
    
    // Add customer-specific fields if customer
    if (role === 'customer') {
      userData.customerId = user.customerId
      userData.introducerId = user.introducerId
    }
    
    res.json({
      token,
      user: userData,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Login failed.' })
  }
})

router.get('/introducer/:id', async (req, res) => {
  try {
    const introducer = await User.findOne({ 
      where: { introducerId: req.params.id }, 
      attributes: ['name', 'email', 'phone', 'introducerId'] 
    })
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
    
    // Check both tables
    let user = await User.findOne({ where: { email } })
    let userModel = User

    if (!user) {
      user = await Admin.findOne({ where: { email } })
      userModel = Admin
    }
    
    if (!user) {
      return res.status(200).json({ message: 'If the email exists, password reset instructions have been sent.' })
    }
    
    const token = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60)
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
    
    const { Op } = await import('sequelize')
    
    // Check both tables
    let user = await User.findOne({ 
      where: { 
        resetPasswordToken: token, 
        resetPasswordExpires: { [Op.gt]: new Date() } 
      } 
    })

    if (!user) {
      user = await Admin.findOne({ 
        where: { 
          resetPasswordToken: token, 
          resetPasswordExpires: { [Op.gt]: new Date() } 
        } 
      })
    }
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token.' })
    }
    
    const newHashed = await bcrypt.hash(password, 10)
    // hashed password created on reset
    user.password = newHashed
    user.resetPasswordToken = null
    user.resetPasswordExpires = null
    await user.save()
    // stored password after reset saved
    
    res.json({ message: 'Password has been reset successfully.' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Unable to reset password.' })
  }
})

export default router
