import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import illustration from '../assets/referral-illustration.svg'

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
      const response = await signIn(credentials)
      if (response.user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell login-page">
      <section className="page-panel card login-layout">
        <div className="login-illustration">
          <img src={illustration} alt="Referral illustration" />
        </div>
        <div className="login-panel">
          <h1>Customer Login</h1>
          <p className="subtitle">Secure access to your customer dashboard.</p>
          <Alert type="danger" message={error} />
          <form onSubmit={handleSubmit} className="form-grid login-form">
            <FloatingInput label="Email Address" name="email" type="email" value={credentials.email} onChange={handleChange} required />
            <FloatingInput label="Password" name="password" type="password" value={credentials.password} onChange={handleChange} required showToggle />
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>
          <div className="form-footer">
            <button type="button" className="button-link" onClick={() => navigate('/forgot-password')}>Forgot password?</button>
            <button type="button" className="button-link" onClick={() => navigate('/register')}>Create account</button>
            <button type="button" className="button-link" onClick={() => navigate('/')}> Home</button>
          </div>
        </div>
      </section>
    </main>
  )
}
