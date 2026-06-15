import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import Profile from './pages/Profile.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminCustomers from './pages/AdminCustomers.jsx'
import NotFound from './pages/NotFound.jsx'
import './index.css'
import './App.css'

function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(typeof window !== 'undefined' ? window.innerWidth <= 900 : false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} onClick={(e) => {
      // close user menu when clicking outside
      if (!e.target.closest || !e.target.closest('.user-menu')) {
        setUserMenuOpen(false)
      }
    }}>
      {user && <Sidebar onToggle={() => setSidebarCollapsed((s) => !s)} />}
      <div className={`app-content ${user ? 'with-sidebar' : ''}`}>
        {user && (
          <header className="topbar">
            <button className="hamburger" onClick={() => setSidebarCollapsed((s) => !s)} aria-label="Toggle sidebar">☰</button>
            <div className="topbar-right">
              <div className="user-menu">
                <button className="user-icon" onClick={() => setUserMenuOpen((v) => !v)}>{user.name?.[0] || 'U'}</button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    {user?.role !== 'admin' && (
                      <button className="button button-link" onClick={() => { setUserMenuOpen(false); window.location.href = '/profile' }}>View Profile</button>
                    )}
                    <button className="button button-link" onClick={() => { setUserMenuOpen(false); signOut() }}>Logout</button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}
        {children}
      </div>
    </div>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
