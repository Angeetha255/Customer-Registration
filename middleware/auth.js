/* global process */
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import User from '../models/User.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return res.status(401).json({ message: 'Authorization token required' })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    let user
    
    // Determine which model to query based on role
    if (payload.role === 'admin') {
      user = await Admin.findByPk(payload.id, { attributes: { exclude: ['password'] } })
    } else {
      user = await User.findByPk(payload.id, { attributes: { exclude: ['password'] } })
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' })
    }
    
    // Convert to plain object and add role
    req.user = { ...user.toJSON(), role: payload.role }
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}
