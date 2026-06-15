import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { updateProfile, fetchIntroducer } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import BackButton from '../components/BackButton.jsx'

/* Generic avatar SVG — business person illustration */
function AvatarIcon() {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width="110" height="110">
      <circle cx="60" cy="60" r="60" fill="#dce8f5" />
      {/* head */}
      <circle cx="60" cy="44" r="22" fill="#f0c08a" />
      {/* hair */}
      <ellipse cx="60" cy="27" rx="22" ry="12" fill="#7a4a1e" />
      <ellipse cx="42" cy="34" rx="8" ry="10" fill="#7a4a1e" />
      <ellipse cx="78" cy="34" rx="8" ry="10" fill="#7a4a1e" />
      {/* neck */}
      <rect x="54" y="64" width="12" height="10" fill="#f0c08a" />
      {/* body / suit */}
      <path d="M20 120 Q20 88 60 84 Q100 88 100 120Z" fill="#2d2d2d" />
      {/* shirt */}
      <path d="M52 84 L60 100 L68 84 Q64 82 60 82 Q56 82 52 84Z" fill="#ffffff" />
      {/* tie */}
      <path d="M58 86 L60 98 L62 86 L60 83Z" fill="#e07820" />
    </svg>
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  const [introducerInfo, setIntroducerInfo] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  }, [user])

  useEffect(() => {
    const loadIntroducer = async () => {
      if (user?.introducerId) {
        try {
          const data = await fetchIntroducer(user.introducerId)
          setIntroducerInfo(data)
        } catch {
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
      setEditing(false)
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
    return `${dd}/${mm}/${yyyy}`
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <BackButton />
      <Alert type={error ? 'danger' : 'success'} message={error || message} />

      <section className="profile-card">

        {/* ── Avatar + identity ── */}
        <div className="profile-hero">
          <div className="profile-avatar">
            <AvatarIcon />
          </div>
          <h2 className="profile-name">
            {user?.name || '—'}
            {user?.customerId && <span className="profile-cid"> ({user.customerId})</span>}
          </h2>
          {user?.registeredAt && (
            <span className="profile-since">Member since {formatDate(user.registeredAt)}</span>
          )}
        </div>

        {/* ── Info rows ── */}
        {!editing && (
          <div className="profile-info-list">
            <ProfileRow label="Introducer Name" value={introducerInfo?.name || '—'} />
            <ProfileRow label="Introducer ID"   value={user?.introducerId || '—'} />
            <ProfileRow label="Phone"           value={user?.phone || '—'} />
            <ProfileRow label="Email"           value={user?.email || '—'} />
            <ProfileRow label="Date Joined"     value={formatDate(user?.registeredAt)} />
            <div className="profile-edit-trigger">
              <button className="button button-secondary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* ── Edit form ── */}
        {editing && (
          <form onSubmit={handleSubmit} className="profile-edit-form">
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
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
            <div className="profile-edit-actions">
              <button type="button" className="button button-muted" onClick={() => { setEditing(false); setError(''); setMessage('') }}>
                Cancel
              </button>
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

      </section>
    </main>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}:</span>
      <span className="profile-row-value">{value}</span>
    </div>
  )
}
