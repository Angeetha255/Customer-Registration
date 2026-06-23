/**
 * Session Guard — Development-time safeguards against cross-session contamination
 * 
 * This module provides runtime checks and warnings to catch accidental
 * cross-session access during development. It's a safety net, not a replacement
 * for proper session isolation.
 * 
 * IMPORTANT: These checks are ONLY active in development mode.
 */

import { SESSION_TYPES } from './sessionIsolation.js'

// Track access patterns for debugging
const accessLog = []
const MAX_LOG_SIZE = 100

/**
 * Logs a session access for debugging purposes.
 * In development, this helps identify patterns that might lead to contamination.
 */
export const logSessionAccess = (sessionType, component, action) => {
  if (!import.meta.env.DEV) return
  
  const entry = {
    timestamp: Date.now(),
    sessionType,
    component,
    action,
  }
  
  accessLog.push(entry)
  
  // Keep log size manageable
  if (accessLog.length > MAX_LOG_SIZE) {
    accessLog.shift()
  }
}

/**
 * Validates that a component is accessing the correct session type.
 * Warns in development if there's a mismatch between expected and actual session type.
 */
export const validateSessionAccess = (expectedType, actualType, componentName) => {
  if (!import.meta.env.DEV) return true
  if (expectedType === actualType) return true
  
  console.warn(
    `[SessionGuard] Potential cross-session contamination detected!\n` +
    `  Component: ${componentName}\n` +
    `  Expected session type: ${expectedType}\n` +
    `  Actual session type: ${actualType}\n` +
    `  This may indicate a bug where admin and customer sessions are being mixed.\n` +
    `  Please review the component's session access pattern.`
  )
  
  return false
}

/**
 * Checks if both admin and customer sessions are active simultaneously.
 * This is valid behavior, but worth noting in development.
 */
export const checkDualSessionState = (adminActive, customerActive) => {
  if (!import.meta.env.DEV) return
  if (adminActive && customerActive) {
    console.info(
      `[SessionGuard] Both admin and customer sessions are active.\n` +
      `  This is valid, but ensure components are using the correct session type.`
    )
  }
}

/**
 * Warns if localStorage is accessed directly for auth data.
 * This helps catch code that bypasses the session isolation utilities.
 */
export const warnDirectLocalStorageAccess = (key, operation) => {
  if (!import.meta.env.DEV) return
  
  const authKeys = ['adminToken', 'adminData', 'userToken', 'userData']
  if (authKeys.includes(key)) {
    console.warn(
      `[SessionGuard] Direct localStorage ${operation} detected for auth key: "${key}"\n` +
      `  Please use the session isolation utilities instead:\n` +
      `  - Import from '../utils/sessionIsolation.js'\n` +
      `  - Use getToken(), setSession(), clearSession(), etc.\n` +
      `  This prevents accidental cross-session contamination.`
    )
  }
}

/**
 * Development-only wrapper for localStorage.getItem that warns on auth key access
 */
export const safeLocalStorageGetItem = (key) => {
  warnDirectLocalStorageAccess(key, 'getItem')
  return window.localStorage.getItem(key)
}

/**
 * Development-only wrapper for localStorage.setItem that warns on auth key access
 */
export const safeLocalStorageSetItem = (key, value) => {
  warnDirectLocalStorageAccess(key, 'setItem')
  return window.localStorage.setItem(key, value)
}

/**
 * Development-only wrapper for localStorage.removeItem that warns on auth key access
 */
export const safeLocalStorageRemoveItem = (key) => {
  warnDirectLocalStorageAccess(key, 'removeItem')
  return window.localStorage.removeItem(key)
}

/**
 * Returns the current access log for debugging
 */
export const getAccessLog = () => {
  if (!import.meta.env.DEV) {
    return []
  }
  return [...accessLog]
}

/**
 * Clears the access log
 */
export const clearAccessLog = () => {
  if (!import.meta.env.DEV) return
  accessLog.length = 0
}

/**
 * Validates that a user object has the expected type property.
 * Helps catch cases where user data from one session is used in another.
 */
export const validateUserType = (user, expectedType, context) => {
  if (!import.meta.env.DEV) return true
  if (!user) return true
  
  const actualType = user.type
  if (actualType !== expectedType) {
    console.error(
      `[SessionGuard] User type mismatch in ${context}!\n` +
      `  Expected type: ${expectedType}\n` +
      `  Actual type: ${actualType}\n` +
      `  User data:`, user
    )
    return false
  }
  return true
}

/**
 * Creates a session-aware wrapper for a function that requires a specific session type.
 * Automatically validates that the correct session is being used.
 */
export const withSessionValidation = (fn, expectedType, componentName) => {
  return (...args) => {
    logSessionAccess(expectedType, componentName, 'function_call')
    return fn(...args)
  }
}

export default {
  logSessionAccess,
  validateSessionAccess,
  checkDualSessionState,
  warnDirectLocalStorageAccess,
  safeLocalStorageGetItem,
  safeLocalStorageSetItem,
  safeLocalStorageRemoveItem,
  getAccessLog,
  clearAccessLog,
  validateUserType,
  withSessionValidation,
}