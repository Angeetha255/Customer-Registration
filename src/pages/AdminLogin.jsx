import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'

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
        setError('Only admin users can access this panel.')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell admin-login">
      <section className="page-panel card admin-login-panel">
        <h1>Admin Login</h1>
        <p className="subtitle">Access the admin panel to manage customers.</p>
        <Alert type="danger" message={error} />
        <form onSubmit={handleSubmit} className="form-grid admin-login-form">
          <label>
            Email Address
            <input name="email" type="email" value={credentials.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={credentials.password} onChange={handleChange} required />
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  )
}
