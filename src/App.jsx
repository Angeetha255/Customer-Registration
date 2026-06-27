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
import Settings from './pages/Settings.jsx'
import BusinessDirectory from './pages/BusinessDirectory.jsx'
import MyDirect from './pages/MyDirect.jsx'
import MyTeam from './pages/MyTeam.jsx'
import TeamView from './pages/TeamView.jsx'
import NotFound from './pages/NotFound.jsx'
import MasterCountries from './pages/MasterCountries.jsx'
import MasterStates from './pages/MasterStates.jsx'
import MasterDistricts from './pages/MasterDistricts.jsx'
import MasterAreas from './pages/MasterAreas.jsx'
import MasterCategories from './pages/MasterCategories.jsx'
import MasterSubCategories from './pages/MasterSubCategories.jsx'
import { fetchTopId, setTopId, updateTopId, fetchAdminStats, createFirstTopId } from './services/api.js'
import Toast from './components/Toast.jsx'
import './index.css'
import './App.css'

function AppLayout({ children }) {
  const { adminUser, customerUser, signOut, getUser } = useAuth()
  const location = useLocation()
  
  // Use the correct user based on current route to support simultaneous admin+customer sessions
  const isAdminRoute = location.pathname.startsWith('/admin')
  const user = isAdminRoute ? adminUser : customerUser
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
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [users, setUsers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [firstTopIdForm, setFirstTopIdForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })

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

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const data = await fetchAdminCustomers({ page: 1, limit: 100 })
      setUsers(data.customers || [])
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const openUpdateTopIdModal = async () => {
    setError('')
    setTopIdForm({ name: '', email: '', phone: '', password: '' })
    setSelectedUserId('')
    setFirstTopIdForm({ name: '', email: '', phone: '', password: '' })
    if (!topUser) {
      await fetchUsers()
    }
    setUpdateTopIdModalOpen(true)
  }

  const handleUpdateTopId = async (e) => {
    e.preventDefault()
    try {
      const response = await updateTopId(topIdForm)
      setTopUser(response.topUser)
      setTopIdForm({ name: '', email: '', phone: '', password: '' })
      setUpdateTopIdModalOpen(false)
      setError('')
      setToast({ message: response.message || 'Top ID updated successfully.', type: 'success' })
      // Notify AdminDashboard to refresh
      window.dispatchEvent(new CustomEvent('topIdUpdated'))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleSetTopId = async (e) => {
    e.preventDefault()
    if (!selectedUserId) {
      setError('Please select a user.')
      return
    }
    try {
      const response = await setTopId(selectedUserId)
      setTopUser(response.topUser)
      setSelectedUserId('')
      setUpdateTopIdModalOpen(false)
      setError('')
      setToast({ message: response.message || 'Top ID set successfully.', type: 'success' })
      // Notify AdminDashboard to refresh
      window.dispatchEvent(new CustomEvent('topIdUpdated'))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleCreateFirstTopId = async (e) => {
    e.preventDefault()
    const { name, email, phone, password } = firstTopIdForm
    if (!name || !email || !phone || !password) {
      setError('All fields are required.')
      return
    }
    if (!/^[0-9]{10}$/.test(String(phone))) {
      setError('Phone number must be 10 digits.')
      return
    }
    try {
      const response = await createFirstTopId(firstTopIdForm)
      setTopUser(response.topUser)
      setFirstTopIdForm({ name: '', email: '', phone: '', password: '' })
      setUpdateTopIdModalOpen(false)
      setError('')
      setToast({ message: response.message || 'Top ID created successfully.', type: 'success' })
      // Notify AdminDashboard to refresh
      window.dispatchEvent(new CustomEvent('topIdUpdated'))
    } catch (err) {
      setError(err.message)
    }
  }

  // Public routes — never show sidebar or topbar
  const PUBLIC_ROUTES = ['/', '/user-register', '/user-login', '/forgot-password', '/reset-password', '/admin/login']
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
                            openUpdateTopIdModal()
                          }}
                        >
                          {topUser ? 'Update Top ID' : 'Set Top ID'}
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
                      onClick={() => { 
                        setUserMenuOpen(false); 
                        signOut(isAdminRoute ? 'admin' : 'customer') 
                      }}
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
              <h3>{topUser ? 'Update Top ID Details' : 'Set Top ID'}</h3>
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
              ) : users.length === 0 ? (
                <form id="create-first-top-id-form" onSubmit={handleCreateFirstTopId} className="form-grid">
                  <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
                    No users exist yet. Create the first user as the Top ID. New user registrations require a Top ID.
                  </p>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={firstTopIdForm.name}
                      onChange={(e) => setFirstTopIdForm({ ...firstTopIdForm, name: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={firstTopIdForm.email}
                      onChange={(e) => setFirstTopIdForm({ ...firstTopIdForm, email: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Phone Number
                    <input
                      type="tel"
                      value={firstTopIdForm.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setFirstTopIdForm({ ...firstTopIdForm, phone: digits })
                      }}
                      maxLength={10}
                      required
                    />
                  </label>
                  <label>
                    Password
                    <input
                      type="password"
                      value={firstTopIdForm.password}
                      onChange={(e) => setFirstTopIdForm({ ...firstTopIdForm, password: e.target.value })}
                      minLength={6}
                      required
                    />
                  </label>
                </form>
              ) : (
                <form id="set-top-id-form" onSubmit={handleSetTopId} className="form-grid">
                  <p style={{ marginBottom: '16px', color: 'var(--muted)' }}>
                    No Top ID is set. Please select a user to become the Top ID. New user registrations require a Top ID.
                  </p>
                  <label>
                    Select User
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                    >
                      <option value="">-- Select a user --</option>
                      {loadingUsers ? (
                        <option value="" disabled>Loading users...</option>
                      ) : (
                        users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.email}) - ID: {u.id}
                          </option>
                        ))
                      )}
                    </select>
                  </label>
                </form>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="button button-muted" onClick={() => setUpdateTopIdModalOpen(false)}>Cancel</button>
              {topUser ? (
                <button type="submit" form="update-top-id-form" className="button button-primary">Update Top ID</button>
              ) : users.length === 0 ? (
                <button type="submit" form="create-first-top-id-form" className="button button-primary">Create Top ID</button>
              ) : (
                <button type="submit" form="set-top-id-form" className="button button-primary" disabled={loadingUsers || !selectedUserId}>
                  {loadingUsers ? 'Loading...' : 'Set Top ID'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

    </div>
  )
}

function RegisterRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = location.search

  useEffect(() => {
    navigate(`/user-register${query}`, { replace: true })
  }, [navigate, query])

  return null
}

function LoginRedirect() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = location.search

  useEffect(() => {
    navigate(`/user-login${query}`, { replace: true })
  }, [navigate, query])

  return null
}

function AppRoutes() {
  return (
    <Routes future={{ v7_relativeSplatPath: true }}>
      <Route path="/" element={<Landing />} />
      {/* Redirect old routes to new routes, preserving query parameters */}
      <Route path="/register" element={<RegisterRedirect />} />
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/user-register" element={<Register />} />
      <Route path="/user-login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/business-directory" element={<ProtectedRoute><BusinessDirectory /></ProtectedRoute>} />
      <Route path="/genealogy/my-direct" element={<ProtectedRoute><MyDirect /></ProtectedRoute>} />
      <Route path="/genealogy/my-team" element={<ProtectedRoute><MyTeam /></ProtectedRoute>} />
      <Route path="/genealogy/team-view" element={<ProtectedRoute><TeamView /></ProtectedRoute>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />
      <Route path="/admin/masters/countries" element={<AdminRoute><MasterCountries /></AdminRoute>} />
      <Route path="/admin/masters/states" element={<AdminRoute><MasterStates /></AdminRoute>} />
      <Route path="/admin/masters/districts" element={<AdminRoute><MasterDistricts /></AdminRoute>} />
      <Route path="/admin/masters/areas" element={<AdminRoute><MasterAreas /></AdminRoute>} />
      <Route path="/admin/masters/categories" element={<AdminRoute><MasterCategories /></AdminRoute>} />
      <Route path="/admin/masters/subcategories" element={<AdminRoute><MasterSubCategories /></AdminRoute>} />
      <Route path="/admin/settings" element={<AdminRoute><Settings /></AdminRoute>} />
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
