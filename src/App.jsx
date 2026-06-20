import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
import { fetchTopId, updateTopId } from './services/api.js'
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
  const [updateTopIdModalOpen, setUpdateTopIdModalOpen] = useState(false)
  const [topUser, setTopUser] = useState(null)
  const [topIdForm, setTopIdForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [error, setError] = useState('')

  const toggleSidebar = () => setSidebarOpen((v) => !v)

  useEffect(() => {
    if (user?.type === 'admin') {
      fetchTopId()
        .then((topIdData) => {
          setTopUser(topIdData.topUser)
        })
        .catch(() => {
          setTopUser(null)
        })
    }
  }, [user])

  const handleUpdateTopId = async (e) => {
    e.preventDefault()
    try {
      const response = await updateTopId(topIdForm)
      setTopUser(response.topUser)
      setTopIdForm({ name: '', email: '', phone: '', password: '' })
      setUpdateTopIdModalOpen(false)
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

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
                    {user?.type === 'admin' && (
                      <>
                        <button
                          className="button button-link"
                          onClick={() => {
                            setUserMenuOpen(false)
                            setUpdateTopIdModalOpen(true)
                          }}
                        >
                          Update Top ID
                        </button>
                        {/* <button
                          className="button button-link"
                          onClick={() => {
                            setUserMenuOpen(false)
                            setSettingsModalOpen(true)
                          }}
                        >
                          Settings
                        </button> */}
                      </>
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

      {/* Update Top ID Modal */}
      {updateTopIdModalOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setUpdateTopIdModalOpen(false) }}>
          <div className="modal-card">
            <div className="modal-header">
              <h3>Update Top ID Details</h3>
              <button className="modal-close" onClick={() => setUpdateTopIdModalOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger"><p>{error}</p></div>}
              {topUser ? (
                <form id="update-top-id-form" onSubmit={handleUpdateTopId} className="form-grid">
                  <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
                    Current Top ID: <strong>{topUser.name}</strong> ({topUser.email})
                  </p>
                  <label>
                    New Name
                    <input
                      type="text"
                      value={topIdForm.name}
                      onChange={(e) => setTopIdForm({ ...topIdForm, name: e.target.value })}
                    />
                  </label>
                  <label>
                    New Email
                    <input
                      type="email"
                      value={topIdForm.email}
                      onChange={(e) => setTopIdForm({ ...topIdForm, email: e.target.value })}
                    />
                  </label>
                  <label>
                    New Phone
                    <input
                      type="tel"
                      value={topIdForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setTopIdForm({ ...topIdForm, phone: digits })
                      }}
                      maxLength={10}
                    />
                  </label>
                  <label>
                    New Password
                    <input
                      type="password"
                      value={topIdForm.password}
                      onChange={(e) => setTopIdForm({ ...topIdForm, password: e.target.value })}
                      minLength={6}
                    />
                  </label>
                </form>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No Top ID found!</p>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button button-muted" onClick={() => setUpdateTopIdModalOpen(false)}>Cancel</button>
              {topUser && <button type="submit" form="update-top-id-form" className="button button-primary">Update Top ID</button>}
            </div>
          </div>
        </div>
      )}

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
