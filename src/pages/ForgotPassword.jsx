import { useState } from 'react'
import { forgotPassword } from '../services/api.js'
import Alert from '../components/Alert.jsx'

export default function ForgotPassword() {
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
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="page-panel card">
        <h1>Forgot Password</h1>
        <p className="subtitle">Enter your email to receive a password reset token.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Email Address
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </label>
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Request reset'}
          </button>
        </form>
      </section>
    </main>
  )
}
