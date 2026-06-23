import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin, loginAdmin as apiLoginAdmin, fetchMeAdmin } from '../services/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null)
  const [customerUser, setCustomerUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const adminToken = window.localStorage.getItem('adminToken')
      const userToken = window.localStorage.getItem('userToken')
      
      // Initialize admin session if admin token exists
      if (adminToken) {
        try {
          const data = await fetchMeAdmin()
          setAdminUser(data)
        } catch {
          window.localStorage.removeItem('adminToken')
          window.localStorage.removeItem('adminData')
        }
      }
      
      // Initialize customer session if user token exists
      if (userToken) {
        try {
          const data = await fetchMe()
          setCustomerUser(data)
        } catch {
          window.localStorage.removeItem('userToken')
          window.localStorage.removeItem('userData')
        }
      }
      
      setLoading(false)
    }
    initializeAuth()
  }, [])

  // Customer sign-in — only affects customer session
  const signIn = async (credentials) => {
    // Only clear customer session, never touch admin session
    window.localStorage.removeItem('userToken')
    window.localStorage.removeItem('userData')
    setCustomerUser(null)

    const response = await apiLogin(credentials)
    window.localStorage.setItem('userToken', response.token)
    window.localStorage.setItem('userData', JSON.stringify(response.user))
    setCustomerUser(response.user)
    return response
  }

  // Admin sign-in — only affects admin session
  const signInAdmin = async (credentials) => {
    // Only clear admin session, never touch customer session
    window.localStorage.removeItem('adminToken')
    window.localStorage.removeItem('adminData')
    setAdminUser(null)

    const response = await apiLoginAdmin(credentials)
    window.localStorage.setItem('adminToken', response.token)
    window.localStorage.setItem('adminData', JSON.stringify(response.user))
    setAdminUser(response.user)
    return response
  }

  const signOut = (type) => {
    if (type === 'admin') {
      window.localStorage.removeItem('adminToken')
      window.localStorage.removeItem('adminData')
      setAdminUser(null)
      window.location.href = '/admin/login'
    } else {
      window.localStorage.removeItem('userToken')
      window.localStorage.removeItem('userData')
      setCustomerUser(null)
      window.location.href = '/login'
    }
  }

  // Determine which user is active based on current route/context
  const user = adminUser || customerUser

  return (
    <AuthContext.Provider value={{ 
      user, 
      adminUser, 
      customerUser,
      loading, 
      signIn, 
      signInAdmin, 
      signOut, 
      setAdminUser,
      setCustomerUser 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
