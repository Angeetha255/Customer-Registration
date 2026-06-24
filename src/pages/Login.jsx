import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'

export default function Login() {
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
      await signIn(credentials)
      // Customer login always goes to dashboard — no role check needed
      navigate('/dashboard')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="user-login-page">
      <div className="user-login-card">
        <div className="logo-section">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1>User Login</h1>
          <p className="subtitle">Secure access to your customer dashboard.</p>
        </div>

        <Alert type="danger" message={error} />
        <form onSubmit={handleSubmit} className="user-login-form">
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
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="form-footer">
          <button type="button" className="button-link" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
          <button type="button" className="button-link" onClick={() => navigate('/user-register')}>Create account</button>
          <button type="button" className="button-link" onClick={() => navigate('/')}>Home</button>
        </div>
      </div>
    </main>
  )
}
