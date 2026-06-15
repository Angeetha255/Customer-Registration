import { createContext, useContext, useEffect, useState } from 'react'
import { fetchMe, login as apiLogin } from '../services/api.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const token = window.localStorage.getItem('authToken')
      if (!token) {
        setLoading(false)
        return
      }
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

  const signIn = async (credentials) => {
    const response = await apiLogin(credentials)
    window.localStorage.setItem('authToken', response.token)
    setUser(response.user)
    return response
  }

  const signOut = () => {
    const role = user?.role
    window.localStorage.removeItem('authToken')
    setUser(null)
    // Redirect to common login page
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
