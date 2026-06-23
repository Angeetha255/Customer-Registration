/**
 * Session Isolation Utilities
 * 
 * This module enforces strict separation between Admin and Customer sessions.
 * All storage keys, token access, and session operations must go through these utilities.
 * 
 * NEVER use localStorage directly for auth data — always use these helpers.
 */

// ── Storage Key Constants ──────────────────────────────────────────────────
export const STORAGE_KEYS = Object.freeze({
  ADMIN: {
    TOKEN: 'adminToken',
    DATA: 'adminData',
  },
  CUSTOMER: {
    TOKEN: 'userToken',
    DATA: 'userData',
  },
})

// ── Session Type Guard ─────────────────────────────────────────────────────
export const SESSION_TYPES = Object.freeze({
  ADMIN: 'admin',
  CUSTOMER: 'customer',
})

/**
 * Validates that a session type is one of the allowed values.
 * Throws if an invalid type is passed — prevents silent failures.
 */
export const assertValidSessionType = (type) => {
  if (type !== SESSION_TYPES.ADMIN && type !== SESSION_TYPES.CUSTOMER) {
    throw new Error(
      `Invalid session type: "${type}". Must be "${SESSION_TYPES.ADMIN}" or "${SESSION_TYPES.CUSTOMER}".`
    )
  }
}

/**
 * Returns the storage keys for a given session type.
 * Use this instead of hardcoding key strings.
 */
export const getStorageKeys = (type) => {
  assertValidSessionType(type)
  return type === SESSION_TYPES.ADMIN ? STORAGE_KEYS.ADMIN : STORAGE_KEYS.CUSTOMER
}

// ── Token Access (read-only) ───────────────────────────────────────────────
/**
 * Safely reads a token from localStorage for the given session type.
 * Never reads the wrong session's token.
 */
export const getToken = (type) => {
  const keys = getStorageKeys(type)
  return window.localStorage.getItem(keys.TOKEN)
}

/**
 * Safely reads session data from localStorage for the given session type.
 * Never reads the wrong session's data.
 */
export const getSessionData = (type) => {
  const keys = getStorageKeys(type)
  const raw = window.localStorage.getItem(keys.DATA)
  return raw ? JSON.parse(raw) : null
}

// ── Token Write Operations ─────────────────────────────────────────────────
/**
 * Sets a token for the given session type.
 * Automatically clears any existing token for that session first.
 * Never touches the other session's data.
 */
export const setToken = (type, token) => {
  assertValidSessionType(type)
  const keys = getStorageKeys(type)
  // Clear existing token for this session before setting new one
  window.localStorage.removeItem(keys.TOKEN)
  window.localStorage.setItem(keys.TOKEN, token)
}

/**
 * Sets session data for the given session type.
 * Automatically clears any existing data for that session first.
 * Never touches the other session's data.
 */
export const setSessionData = (type, data) => {
  assertValidSessionType(type)
  const keys = getStorageKeys(type)
  // Clear existing data for this session before setting new one
  window.localStorage.removeItem(keys.DATA)
  window.localStorage.setItem(keys.DATA, JSON.stringify(data))
}

/**
 * Sets both token and data atomically for a session type.
 */
export const setSession = (type, token, data) => {
  assertValidSessionType(type)
  setToken(type, token)
  setSessionData(type, data)
}

// ── Session Clear Operations ───────────────────────────────────────────────
/**
 * Clears ONLY the specified session type from localStorage.
 * The other session is never affected.
 */
export const clearSession = (type) => {
  assertValidSessionType(type)
  const keys = getStorageKeys(type)
  window.localStorage.removeItem(keys.TOKEN)
  window.localStorage.removeItem(keys.DATA)
}

/**
 * Clears BOTH admin and customer sessions.
 * Use only for full logout or security-sensitive operations.
 */
export const clearAllSessions = () => {
  clearSession(SESSION_TYPES.ADMIN)
  clearSession(SESSION_TYPES.CUSTOMER)
}

// ── Validation Helpers ─────────────────────────────────────────────────────
/**
 * Checks if a session of the given type has a valid token stored.
 */
export const hasSession = (type) => {
  const token = getToken(type)
  return token !== null && token !== undefined && token !== ''
}

/**
 * Returns which session types are currently active.
 */
export const getActiveSessions = () => {
  return {
    admin: hasSession(SESSION_TYPES.ADMIN),
    customer: hasSession(SESSION_TYPES.CUSTOMER),
  }
}

// ── Debug Utility (development only) ──────────────────────────────────────
/**
 * Returns a safe summary of session state for debugging.
 * Never exposes actual tokens.
 */
export const getSessionDebugInfo = () => {
  const active = getActiveSessions()
  return {
    activeSessions: active,
    adminDataPresent: !!getSessionData(SESSION_TYPES.ADMIN),
    customerDataPresent: !!getSessionData(SESSION_TYPES.CUSTOMER),
    // Token presence only (not values)
    adminTokenPresent: !!getToken(SESSION_TYPES.ADMIN),
    customerTokenPresent: !!getToken(SESSION_TYPES.CUSTOMER),
  }
}

export default {
  STORAGE_KEYS,
  SESSION_TYPES,
  assertValidSessionType,
  getStorageKeys,
  getToken,
  getSessionData,
  setToken,
  setSessionData,
  setSession,
  clearSession,
  clearAllSessions,
  hasSession,
  getActiveSessions,
  getSessionDebugInfo,
}