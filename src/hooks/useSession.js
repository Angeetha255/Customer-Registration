import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { 
  SESSION_TYPES, 
  getToken, 
  assertValidSessionType,
  getSessionDebugInfo 
} from '../utils/sessionIsolation.js'

/**
 * useSession — Type-safe session access hook
 * 
 * This hook enforces explicit session type selection to prevent
 * accidental cross-session contamination. Always specify whether
 * you need 'admin' or 'customer' session data.
 * 
 * Usage:
 *   const { user, token, isLoggedIn } = useSession('customer')
 *   const { user: admin, token: adminToken } = useSession('admin')
 */
export function useSession(type) {
  assertValidSessionType(type)
  const { getUser, adminUser, customerUser, loading } = useAuth()
  
  const user = type === SESSION_TYPES.ADMIN ? adminUser : customerUser
  const token = getToken(type)
  const isLoggedIn = !!user && !!token

  const refresh = useCallback(async () => {
    // This would trigger a re-fetch if needed
    // For now, consumers should rely on the context's loading state
    return user
  }, [type, user])

  return {
    user,
    token,
    isLoggedIn,
    loading,
    type,
    refresh,
    // Expose debug info in development
    ...(import.meta.env.DEV && {
      debug: getSessionDebugInfo(),
    }),
  }
}

/**
 * useAdminSession — Convenience hook for admin-only components
 * Automatically uses 'admin' session type
 */
export function useAdminSession() {
  return useSession(SESSION_TYPES.ADMIN)
}

/**
 * useCustomerSession — Convenience hook for customer-only components
 * Automatically uses 'customer' session type
 */
export function useCustomerSession() {
  return useSession(SESSION_TYPES.CUSTOMER)
}

export default useSession