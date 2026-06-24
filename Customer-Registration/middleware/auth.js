/* global process */
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import Admin from '../models/Admin.js'
import User from '../models/User.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret'

/**
 * authMiddleware — verifies the Bearer token.
 * Token payload: { type: 'customer' | 'admin', id }
 * Sets req.user (plain object) and req.userType ('customer' | 'admin').
 */
export const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Authorization token required' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    // Support both new { type } and legacy { role } tokens during transition
    const type = payload.type || (payload.role === 'admin' ? 'admin' : 'customer')

    let user
    if (type === 'admin') {
      user = await Admin.findByPk(payload.id, { attributes: { exclude: ['password'] } })
    } else {
      user = await User.findByPk(payload.id, { attributes: { exclude: ['password'] } })
    }

    if (!user) return res.status(401).json({ message: 'Invalid token' })

    req.user = { ...user.toJSON(), type }
    req.userType = type
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

/**
 * requireAdmin — route guard for admin-only endpoints.
 * Replaces requireRole('admin') — no role column needed.
 */
export const requireAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Legacy alias so existing requireRole('admin') calls keep working
export const requireRole = (role) => (req, res, next) => {
  const required = role === 'admin' ? 'admin' : 'customer'
  if (req.userType !== required) {
    return res.status(403).json({ message: 'Insufficient permissions' })
  }
  next()
}
