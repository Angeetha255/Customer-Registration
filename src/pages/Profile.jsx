import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile, fetchIntroducer } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import BackButton from '../components/BackButton.jsx'

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  const [introducerInfo, setIntroducerInfo] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  }, [user])

  useEffect(() => {
    const loadIntroducer = async () => {
      if (user?.introducerId) {
        try {
          const data = await fetchIntroducer(user.introducerId)
          setIntroducerInfo(data)
        } catch (e) {
          setIntroducerInfo(null)
        }
      }
    }
    loadIntroducer()
  }, [user])

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
      if (updated) setUser(updated)
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err.message || 'Failed to update profile.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    const dt = new Date(d)
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  return (
    <main className="page-shell layout-with-sidebar">
      

      {/* Account details removed per request; only editable form retained */}

      <section className="page-panel card no-border-panel">
        <h2>Profile</h2>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />
      
          <form onSubmit={handleSubmit} className="form-grid profile-form">
             <label>
              Full Name
              <input name="name" value={form.name} onChange={handleChange} required />
            </label>
            <label>
              Phone Number
              <input name="phone" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" value={form.email || ''} onChange={handleChange} required />
            </label>
            <label>
              Date Joined
              <input value={formatDate(user?.registeredAt)} disabled />
            </label>
            <label>
              Introducer ID
              <input value={user?.introducerId || '—'} disabled />
            </label>
            <label>
              Introducer Name
              <input value={introducerInfo?.name || '—'} disabled />
            </label>
          

          
           
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </form>
       
      </section>
    </main>
  )
}
