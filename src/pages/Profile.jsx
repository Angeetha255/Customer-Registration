import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useLocation } from 'react-router-dom'
import { updateProfile, fetchReferredCustomers, fetchMe } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import Toast from '../components/Toast.jsx'

/* Generic avatar SVG — business person illustration */
function AvatarIcon() {
  return (
    <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" width="110" height="110">
      <circle cx="60" cy="60" r="60" fill="#dce8f5" />
      <circle cx="60" cy="44" r="22" fill="#f0c08a" />
      <ellipse cx="60" cy="27" rx="22" ry="12" fill="#7a4a1e" />
      <ellipse cx="42" cy="34" rx="8" ry="10" fill="#7a4a1e" />
      <ellipse cx="78" cy="34" rx="8" ry="10" fill="#7a4a1e" />
      <rect x="54" y="64" width="12" height="10" fill="#f0c08a" />
      <path d="M20 120 Q20 88 60 84 Q100 88 100 120Z" fill="#2d2d2d" />
      <path d="M52 84 L60 100 L68 84 Q64 82 60 82 Q56 82 52 84Z" fill="#ffffff" />
      <path d="M58 86 L60 98 L62 86 L60 83Z" fill="#e07820" />
    </svg>
  )
}

export default function Profile() {
  const { user, setUser } = useAuth()
  const location = useLocation()
  const fromUserIcon = location.state?.fromUserIcon === true

  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  const [referred, setReferred] = useState([])
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  // profileData holds the fully enriched user (with referrerName, referrerDisplayId, referralId)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
  }, [user])

  // Fetch the enriched /me on mount to get referrerName, referrerDisplayId, referralId
  useEffect(() => {
    fetchMe()
      .then((data) => setProfileData(data))
      .catch(() => setProfileData(null))
  }, [])

  useEffect(() => {
    fetchReferredCustomers()
      .then((data) => setReferred(data.referred || []))
      .catch(() => setReferred([]))
  }, [])

  // Merge: profileData overrides user for display fields
  const profile = profileData || user

  const openEdit = () => {
    setForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' })
    setError('')
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setError('')
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setForm({ ...form, phone: digits })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (!/^[0-9]{10}$/.test(form.phone)) {
        setError('Phone number must be 10 digits.')
        setLoading(false)
        return
      }
      const { user: updated } = await updateProfile(form)
      if (updated) {
        setUser(updated)
        // Re-fetch enriched profile so referralId/referrerName etc. stay current
        fetchMe().then((data) => setProfileData(data)).catch(() => {})
      }
      closeEdit()
      setToast({ message: 'Profile updated successfully.', type: 'success' })
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

  // Referral link uses the user's own numeric id
  const referralUrl = user?.id ? `${window.location.origin}/register?ref=${user.id}` : null

  const handleCopy = () => {
    if (!referralUrl) return
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <div className="profile-layout">

        {/* ── Left: profile card ── */}
        <section className="profile-card">
          <div className="profile-hero">
            <div className="profile-avatar"><AvatarIcon /></div>
            <h2 className="profile-name">
              {profile?.name || '—'}
              {profile?.userId && (
                <span className="profile-uid">{profile.userId}</span>
              )}
            </h2>
            {profile?.regat && (
              <span className="profile-since">Member since {formatDate(profile.regat)}</span>
            )}
          </div>

          <div className="profile-info-list">
            {/* Referred By: referrer's name | Referrer ID: referrer's referral ID (userId with prefix) */}
            <ProfileRow label="Referred By"      value={profile?.referrerName     || '—'} />
            <ProfileRow label="Referrer ID"      value={profile?.referrerReferralId || '—'} />
            <ProfileRow label="Your Referral ID" value={profile?.referralId        || (profile?.id ? `REF${profile.id}` : '—')}/>

            <ProfileRow label="Phone"            value={profile?.phone            || '—'} />
            <ProfileRow label="Email"            value={profile?.email            || '—'} />
            <ProfileRow label="Date Joined"      value={formatDate(profile?.regat)} />
            {fromUserIcon && (
              <div className="profile-edit-trigger">
                <button className="button button-secondary" onClick={openEdit}>Edit Profile</button>
              </div>
            )}
          </div>
        </section>

        {/* ── Right: referral card ── */}
        <div className="profile-referral-col">

          {/* Referral link card */}
          <div className="pref-card">
            <div className="pref-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              <h3>Referral Link</h3>
            </div>

            {referralUrl ? (
              <>
                <div className="pref-url">{referralUrl}</div>
                <div className="pref-actions">
                  <button className="button button-primary button-small" onClick={handleCopy}>
                    {copied ? '✓ Copied!' : 'Copy Link'}
                  </button>
                  <button className="button button-secondary button-small" onClick={() => window.open(referralUrl, '_blank')}>
                    Open
                  </button>
                </div>
              </>
            ) : (
              <p className="pref-empty">No referral ID assigned yet.</p>
            )}
          </div>

          {/* Stats card */}
          <div className="pref-card">
            <div className="pref-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h3>Referral Stats</h3>
            </div>
            <div className="pref-stats">
              <div className="pref-stat">
                <span className="pref-stat-value">{profile?.refcount ?? 0}</span>
                <span className="pref-stat-label">Total Referrals</span>
              </div>
              <div className="pref-stat">
                <span className="pref-stat-value">{referred.length}</span>
                <span className="pref-stat-label">Referred Users</span>
              </div>
            </div>
          </div>

          {/* Recent referrals */}
          <div className="pref-card">
            <div className="pref-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>Recent Referrals</h3>
              <span className="pref-badge">{referred.length}</span>
            </div>

            {referred.length === 0 ? (
              <p className="pref-empty">No referrals yet. Share your link!</p>
            ) : (
              <ul className="pref-referral-list">
                {referred.slice(0, 5).map((r) => (
                  <li key={r.id} className="pref-referral-item">
                    <div className="pref-referral-avatar">
                      {r.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="pref-referral-info">
                      <div className="pref-referral-name">{r.name}</div>
                      <div className="pref-referral-meta">{r.email}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}>
          <div className="modal-card profile-edit-modal">
            <div className="modal-header">
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={closeEdit} aria-label="Close">✕</button>
            </div>
            <div className="modal-body">
              {error && <Alert type="danger" message={error} />}
              <form id="profile-edit-form" onSubmit={handleSubmit} className="form-grid">
                <label className="profile-modal-label">
                  Full Name
                  <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label className="profile-modal-label">
                  Phone Number
                  <input name="phone" value={form.phone} onChange={handleChange} required />
                </label>
                <label className="profile-modal-label">
                  Email Address
                  <input name="email" type="email" value={form.email} onChange={handleChange} required />
                </label>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="button button-muted" onClick={closeEdit}>Cancel</button>
              <button type="submit" form="profile-edit-form" className="button button-primary" disabled={loading}>
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
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
