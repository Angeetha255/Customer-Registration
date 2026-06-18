import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin, loginAdmin as apiLoginAdmin } from '../services/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = window.localStorage.getItem('authToken')
      if (!token) { setLoading(false); return }
      try {
        const data = await fetchMe()
        setUser(data)
      } catch {
        window.localStorage.removeItem('authToken')
      } finally {
        setLoading(false)
      }
    }
    initializeAuth()
  }, [])

  // Customer sign-in
  const signIn = async (credentials) => {
    const response = await apiLogin(credentials)
    window.localStorage.setItem('authToken', response.token)
    setUser(response.user)
    return response
  }

  // Admin sign-in
  const signInAdmin = async (credentials) => {
    const response = await apiLoginAdmin(credentials)
    window.localStorage.setItem('authToken', response.token)
    setUser(response.user)
    return response
  }

  const signOut = () => {
    const type = user?.type
    window.localStorage.removeItem('authToken')
    setUser(null)
    window.location.href = type === 'admin' ? '/admin-login' : '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInAdmin, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
