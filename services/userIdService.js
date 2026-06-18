/**
 * userIdService.js
 *
 * Generates unique userId values for new and existing users.
 * Format: <prefix><5 random digits>
 * Example: ABC12345 (prefix=ABC, 5 random digits=12345)
 *
 * Prefix is read from settings table key='userIdPrefix'.
 * Default prefix = 'MEM'.
 */

import User from '../models/User.js'
import Settings from '../models/Settings.js'

export const getUserIdPrefix = async () => {
  const setting = await Settings.findOne({ where: { key: 'userIdPrefix' } })
  return setting ? setting.value : 'MEM'
}

/**
 * Generate a unique userId using the current prefix.
 * Retries up to 10 times on collision.
 */
export const generateUserId = async () => {
  const prefix = await getUserIdPrefix()
  for (let i = 0; i < 10; i++) {
    const digits = String(Math.floor(10000 + Math.random() * 90000))
    const candidate = `${prefix}${digits}`
    const existing = await User.findOne({ where: { userId: candidate } })
    if (!existing) return candidate
  }
  // Fallback: use timestamp suffix
  return `${prefix}${Date.now().toString().slice(-5)}`
}
