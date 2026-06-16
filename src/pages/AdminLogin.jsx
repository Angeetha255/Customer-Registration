import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'

export default function AdminLogin() {
  const { signIn } = useAuth()
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleChange = (event) => {
    setCredentials({ ...credentials, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await signIn(credentials)
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        setError('Only admin accounts can access this panel.')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-bg-blob alb1" />
      <div className="admin-login-bg-blob alb2" />

      <div className="admin-login-card">
        {/* Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">CM</div>
          <h1 className="admin-login-title">Admin Panel</h1>
          <p className="admin-login-sub">Secure access for administrators only.</p>
        </div>

        <Alert type="danger" message={error} />

        <form onSubmit={handleSubmit} className="form-grid" style={{ gap: '14px' }}>
          <FloatingInput
            label="Email Address"
            name="email"
            type="email"
            value={credentials.email}
            onChange={handleChange}
            required
          />
          <FloatingInput
            label="Password"
            name="password"
            type="password"
            value={credentials.password}
            onChange={handleChange}
            required
            showToggle
          />
          <button className="button admin-login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In to Admin Panel'}
          </button>
        </form>

        <button
          type="button"
          className="admin-login-back"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>
      </div>
    </main>
  )
}
