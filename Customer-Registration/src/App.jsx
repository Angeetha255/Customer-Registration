import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import Landing from './pages/Landing.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import Profile from './pages/Profile.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminCustomers from './pages/AdminCustomers.jsx'
import MyDirect from './pages/MyDirect.jsx'
import MyTeam from './pages/MyTeam.jsx'
import TeamView from './pages/TeamView.jsx'
import NotFound from './pages/NotFound.jsx'
import './index.css'
import './App.css'

function AppLayout({ children }) {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth > 900 : true
  )
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  // Public routes — never show sidebar or topbar
  const PUBLIC_ROUTES = ['/', '/register', '/login', '/forgot-password', '/reset-password', '/admin-login']
  const isPublic = PUBLIC_ROUTES.includes(location.pathname)
  const showShell = user && !isPublic

  return (
    <div
      className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}
      onClick={(e) => {
        if (!e.target.closest || !e.target.closest('.user-menu')) {
          setUserMenuOpen(false)
        }
      }}
    >
      {showShell && <Sidebar open={sidebarOpen} onToggle={toggleSidebar} />}

      {/* Overlay — closes sidebar on mobile when tapping outside */}
      {showShell && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} aria-hidden="true" />
      )}

      <div className={`app-content ${showShell ? 'with-sidebar' : ''}`}>
        {showShell && (
          <header className="topbar">
            {/* Outside hamburger — only visible when sidebar is closed */}
            {!sidebarOpen && (
              <button
                className="hamburger"
                onClick={toggleSidebar}
                aria-label="Open sidebar"
                aria-expanded={false}
              >
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </button>
            )}
            <div className="topbar-right">
              <div className="user-menu">
                <button className="user-icon" onClick={() => setUserMenuOpen((v) => !v)}>
                  {user.name?.[0] || 'U'}
                </button>
                {userMenuOpen && (
                  <div className="user-dropdown">
                    {user?.type !== 'admin' && (
                      <button
                        className="button button-link"
                        onClick={() => { 
                          setUserMenuOpen(false)
                          navigate('/profile', { state: { fromUserIcon: true } })
                        }}
                      >
                        View Profile
                      </button>
                    )}
                    <button
                      className="button button-link"
                      onClick={() => { setUserMenuOpen(false); signOut() }}
                    >
                      Logout
                    </button>
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
    <Routes future={{ v7_relativeSplatPath: true }}>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/genealogy/my-direct" element={<ProtectedRoute><MyDirect /></ProtectedRoute>} />
      <Route path="/genealogy/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
      <Route path="/genealogy/team-view" element={<ProtectedRoute><TeamView /></ProtectedRoute>} />
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
