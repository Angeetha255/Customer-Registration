import { useState, useEffect } from 'react'
import { resetPassword } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import { useLocation } from 'react-router-dom'

export default function ResetPassword() {
  const [form, setForm] = useState({ token: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const location = useLocation()

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  useEffect(() => {
    // Prefill token from query string if present
    const params = new URLSearchParams(location.search)
    const token = params.get('token')
    if (token) setForm((f) => ({ ...f, token }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const result = await resetPassword(form)
      setMessage(result.message)
      setForm({ token: '', password: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="page-panel card">
        <h1>Reset Password</h1>
        <p className="subtitle">Enter the reset token and a new password.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />
        <form onSubmit={handleSubmit} className="form-grid">
          <FloatingInput label="Reset Token" name="token" value={form.token} onChange={handleChange} required />
          <FloatingInput label="New Password" name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} showToggle />
          <FloatingInput label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} showToggle />
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </section>
    </main>
  )
}
