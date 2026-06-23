import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin, loginAdmin as apiLoginAdmin, fetchMeAdmin } from '../services/api.js'
import { 
  SESSION_TYPES, 
  getToken, 
  setSession, 
  clearSession, 
  setSessionData, 
  getSessionData,
  assertValidSessionType 
} from '../utils/sessionIsolation.js'
import { validateUserType, checkDualSessionState, logSessionAccess } from '../utils/sessionGuard.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null)
  const [customerUser, setCustomerUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      // Initialize admin session if admin token exists
      let adminActive = false
      if (getToken(SESSION_TYPES.ADMIN)) {
        try {
          const data = await fetchMeAdmin()
          setAdminUser(data)
          adminActive = !!data
        } catch {
          clearSession(SESSION_TYPES.ADMIN)
        }
      }
      
      // Initialize customer session if user token exists
      let customerActive = false
      if (getToken(SESSION_TYPES.CUSTOMER)) {
        try {
          const data = await fetchMe()
          setCustomerUser(data)
          customerActive = !!data
        } catch {
          clearSession(SESSION_TYPES.CUSTOMER)
        }
      }
      
      // Log dual session state for debugging
      checkDualSessionState(adminActive, customerActive)
      
      setLoading(false)
    }
    initializeAuth()
  }, [])

  // Customer sign-in — only affects customer session
  const signIn = async (credentials) => {
    // Only clear customer session, never touch admin session
    clearSession(SESSION_TYPES.CUSTOMER)
    setCustomerUser(null)

    const response = await apiLogin(credentials)
    setSession(SESSION_TYPES.CUSTOMER, response.token, response.user)
    // Validate user type before setting
    if (response.user && response.user.type !== 'customer') {
      console.error('[AuthContext] Customer login returned non-customer user:', response.user)
      throw new Error('Invalid user type returned from customer login')
    }
    setCustomerUser(response.user)
    logSessionAccess(SESSION_TYPES.CUSTOMER, 'AuthContext.signIn', 'login')
    return response
  }

  // Admin sign-in — only affects admin session
  const signInAdmin = async (credentials) => {
    // Only clear admin session, never touch customer session
    clearSession(SESSION_TYPES.ADMIN)
    setAdminUser(null)

    const response = await apiLoginAdmin(credentials)
    setSession(SESSION_TYPES.ADMIN, response.token, response.user)
    // Validate user type before setting
    if (response.user && response.user.type !== 'admin') {
      console.error('[AuthContext] Admin login returned non-admin user:', response.user)
      throw new Error('Invalid user type returned from admin login')
    }
    setAdminUser(response.user)
    logSessionAccess(SESSION_TYPES.ADMIN, 'AuthContext.signInAdmin', 'login')
    return response
  }

  const signOut = (type) => {
    if (type === 'admin') {
      clearSession(SESSION_TYPES.ADMIN)
      setAdminUser(null)
      window.location.href = '/admin/login'
    } else {
      clearSession(SESSION_TYPES.CUSTOMER)
      setCustomerUser(null)
      window.location.href = '/login'
    }
  }

  // Helper to get the correct user for a given session type
  const getUser = (type) => {
    assertValidSessionType(type)
    return type === SESSION_TYPES.ADMIN ? adminUser : customerUser
  }

  // Safeguarded setters that validate user type
  const safeSetAdminUser = (user) => {
    if (user && user.type !== 'admin') {
      console.error('[AuthContext] Attempted to set non-admin user as adminUser:', user)
      return
    }
    setAdminUser(user)
  }

  const safeSetCustomerUser = (user) => {
    if (user && user.type !== 'customer') {
      console.error('[AuthContext] Attempted to set non-customer user as customerUser:', user)
      return
    }
    setCustomerUser(user)
  }

  return (
    <AuthContext.Provider value={{ 
      adminUser, 
      customerUser,
      loading, 
      signIn, 
      signInAdmin, 
      signOut, 
      setAdminUser: safeSetAdminUser,
      setCustomerUser: safeSetCustomerUser,
      getUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
