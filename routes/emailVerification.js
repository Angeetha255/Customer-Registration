import express from 'express'
import EmailVerificationToken from '../models/EmailVerificationToken.js'
import { generateSecureToken, hashToken, generateExpirationDate } from '../utils/tokenGenerator.js'
import { sendVerificationEmail } from '../services/emailService.js'

const router = express.Router()

// Helper function for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

/**
 * POST /api/public/email-verification/generate
 * Generate and send magic link for email verification
 */
router.post('/generate', asyncHandler(async (req, res) => {
  try {
    const { email, redirectUrl } = req.body

    // Validate input
    if (!email || !email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid email address is required' 
      })
    }

    // Generate secure token
    const token = generateSecureToken(32)
    const tokenHash = hashToken(token)
    const expiresAt = generateExpirationDate()

    // Store token in database (hashed only)
    await EmailVerificationToken.create({
      email: email.toLowerCase(),
      tokenHash,
      redirectUrl,
      expiresAt,
      used: false
    })

    // Construct magic link
    const magicLink = `${redirectUrl}?verify_token=${token}`

    // Send email
    await sendVerificationEmail(email, magicLink)

    res.json({ 
      success: true, 
      message: 'Verification link sent successfully' 
    })

  } catch (error) {
    console.error('Error generating magic link:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send verification link' 
    })
  }
}))

/**
 * GET /api/public/email-verification/verify
 * Verify magic link token
 */
router.get('/verify', asyncHandler(async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token is required' 
      })
    }

    // Hash the token to compare with stored hash
    const tokenHash = hashToken(token)

    // Find valid token in database
    const verificationRecord = await EmailVerificationToken.findOne({
      where: {
        tokenHash,
        used: false,
        expiresAt: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    })

    if (!verificationRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'This verification link is invalid or has expired' 
      })
    }

    // Mark token as used (single-use)
    await verificationRecord.update({ used: true })

    // Return success with verified email
    res.json({ 
      success: true, 
      verified: true, 
      email: verificationRecord.email 
    })

  } catch (error) {
    console.error('Error verifying magic link:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify link' 
    })
  }
}))

export default router
