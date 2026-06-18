import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile } from '../services/api.js'
import Alert from '../components/Alert.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
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
      const { user: updated } = await updateProfile(form)
      setUser(updated)
      setMessage('Profile updated successfully.')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <section className="page-panel card">
        <h1>Profile</h1>
        <p className="subtitle">Update your customer profile details.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />
        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Full Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Phone Number
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>
    </main>
  )
}
