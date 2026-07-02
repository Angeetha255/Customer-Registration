import crypto from 'crypto'

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of bytes (default: 32)
 * @returns {string} Hex-encoded token
 */
export function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex')
}

/**
 * Hash a token using SHA-256
 * @param {string} token - Plain token
 * @returns {string} Hashed token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Generate expiration date (30 minutes from now)
 * @returns {Date} Expiration date
 */
export function generateExpirationDate() {
  const expiration = new Date()
  expiration.setMinutes(expiration.getMinutes() + 30)
  return expiration
}
