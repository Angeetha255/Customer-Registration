import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { fetchReferredCustomers } from '../services/api.js'

/* ── Inline SVG icons ── */
const Icons = {
  user: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  id: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  link: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  ),
  users: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  team: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="17" cy="7" r="4"/>
    </svg>
  ),
  active: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  position: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  ),
}

const CARD_COLORS = [
  { bg: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)', icon: '#e0d7ff' },
  { bg: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)', icon: '#fde8ea' },
  { bg: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)', icon: '#d0f4ff' },
  { bg: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)', icon: '#d0faf0' },
  { bg: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)', icon: '#fff0cc' },
  { bg: 'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)', icon: '#f3e8ff' },
  { bg: 'linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)', icon: '#fff5ee' },
]

function StatCard({ icon, label, value, colorIdx = 0 }) {
  const c = CARD_COLORS[colorIdx % CARD_COLORS.length]
  return (
    <div className="cd-stat-card" style={{ background: c.bg }}>
      <div className="cd-stat-icon" style={{ background: 'rgba(255,255,255,0.22)' }}>
        {icon}
      </div>
      <div className="cd-stat-body">
        <div className="cd-stat-label">{label}</div>
        <div className="cd-stat-value">{value}</div>
      </div>
    </div>
  )
}

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [referred, setReferred] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchReferredCustomers()
      .then((data) => setReferred(data.referred || []))
      .catch(() => setReferred([]))
  }, [])

  if (!user) return <div className="page-panel">Loading dashboard...</div>

  const profile = user
  // Referral link always uses the user's primary key id
  const referralLink = profile.id ? `${window.location.origin}/register?ref=${profile.id}` : null
  // referralId comes from the /me endpoint (prefix + id)
  const displayReferralId = profile.referralId || `REF${profile.id}`

  const handleCopy = () => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const placementDisplay = profile.placementParentName 
    ? `${profile.placementParentName} (${profile.placementParentDisplayId || '—'})`
    : profile.placeid || '—'

  return (
    <main className="page-shell layout-with-sidebar">

      {/* ── Hero banner ── */}
      <div className="cd-hero">
        <div className="cd-hero-blob cd-hero-blob1" />
        <div className="cd-hero-blob cd-hero-blob2" />
        <div className="cd-hero-content">
          <div className="cd-hero-avatar">{profile.name?.[0]?.toUpperCase() || 'U'}</div>
          <div>
            <h1 className="cd-hero-title">Welcome back, {profile.name?.split(' ')[0]}! 👋</h1>
            <p className="cd-hero-sub">Here's an overview of your account and referral activity.</p>
          </div>
        </div>
        <div className="cd-hero-illo" aria-hidden>
          <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" width="200">
            <circle cx="100" cy="80" r="70" fill="rgba(255,255,255,0.07)"/>
            <circle cx="100" cy="80" r="46" fill="rgba(255,255,255,0.07)"/>
            <circle cx="100" cy="62" r="18" fill="rgba(255,255,255,0.25)"/>
            <path d="M68 110 q32-22 64 0" fill="rgba(255,255,255,0.2)"/>
            <circle cx="48" cy="48" r="12" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <circle cx="155" cy="55" r="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
            <line x1="60" y1="48" x2="88" y2="65" stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3"/>
            <line x1="145" y1="58" x2="117" y2="65" stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3"/>
          </svg>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="cd-cards">
        <StatCard icon={Icons.user}     label="Full Name"         value={profile.name}                     colorIdx={0} />
        <StatCard icon={Icons.id}       label="User ID"           value={profile.userId || `#${profile.id}`} colorIdx={1} />
        <StatCard icon={Icons.users}    label="Total Referrals"   value={profile.refcount ?? 0}            colorIdx={2} />
        <StatCard icon={Icons.active}   label="Active Referrals"  value={profile.refactcount ?? 0}         colorIdx={3} />
        <StatCard icon={Icons.team}     label="Team Count"        value={profile.teamcount ?? 0}           colorIdx={4} />
        <StatCard icon={Icons.active}   label="Team Active Count" value={profile.teamactcount ?? 0}        colorIdx={5} />
        <StatCard icon={Icons.position} label="Placement Parent"  value={placementDisplay}                  colorIdx={6} />
        <StatCard icon={Icons.position} label="Position"          value={profile.position || '—'}           colorIdx={0} />
      </div>

      {/* ── Referral link card ── */}
      {referralLink && (
        <div className="cd-referral-card">
          <div className="cd-referral-left">
            <div className="cd-referral-icon">{Icons.link}</div>
            <div>
              <div className="cd-referral-title">Your Referral Link</div>
              <div className="cd-referral-url">{referralLink}</div>
            </div>
          </div>
          <div className="cd-referral-actions">
            <button type="button" className="button button-primary" onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy Link'}
            </button>
            <button type="button" className="button button-secondary" onClick={() => window.open(referralLink, '_blank')}>
              Open
            </button>
          </div>
        </div>
      )}

      {/* ── Referred customers ── */}
      <div className="cd-referred-section">
        <div className="cd-referred-header">
          <h2>Referred Customers</h2>
          <span className="cd-referred-count">{referred.length}</span>
        </div>

        {referred.length === 0 ? (
          <div className="cd-referred-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>No referrals yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="cd-referred-grid">
            {referred.map((r, i) => (
              <div key={r.id} className="cd-referred-item" style={{ '--delay': `${i * 60}ms` }}>
                <div className="cd-referred-avatar">{r.name?.[0]?.toUpperCase() || '?'}</div>
                <div className="cd-referred-info">
                  <div className="cd-referred-name">{r.name}</div>
                  <div className="cd-referred-meta">{r.email}</div>
                  <div className="cd-referred-meta">{r.phone}</div>
                </div>
                <div className="cd-referred-date">
                  {(() => {
                    if (!r.regat) return '—'
                    const dt = new Date(r.regat)
                    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
                  })()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}
