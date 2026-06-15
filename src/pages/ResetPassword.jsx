import { useState } from 'react'
import { resetPassword } from '../services/api.js'
import Alert from '../components/Alert.jsx'

export default function ResetPassword() {
  const [form, setForm] = useState({ token: '', password: '', confirmPassword: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

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
          <label>
            Reset Token
            <input name="token" value={form.token} onChange={handleChange} required />
          </label>
          <label>
            New Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
          </label>
          <label>
            Confirm Password
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} />
          </label>
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
      </section>
    </main>
  )
}
