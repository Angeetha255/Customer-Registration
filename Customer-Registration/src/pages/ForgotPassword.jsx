import { useState } from 'react'
import { forgotPassword } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import { useNavigate } from 'react-router-dom'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const result = await forgotPassword(email)
      setMessage(result.message)
      // If token returned, navigate to reset page with token in query
      if (result.resetToken) {
        navigate(`/reset-password?token=${encodeURIComponent(result.resetToken)}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="page-panel card auth-card">
        <h1>Forgot Password</h1>
        <p className="subtitle">Enter your email to receive a password reset token.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />
        <form onSubmit={handleSubmit} className="form-grid auth-form">
          <label>
            Email Address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Request reset'}
          </button>
          <button type="button" className="button button-muted" onClick={() => navigate('/login')}>
            Cancel
          </button>
        </form>
      </section>
    </main>
  )
}
