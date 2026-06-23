import { useEffect, useState } from 'react'
import { fetchAdminStats, resetDatabase, fetchTopId } from '../services/api.js'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const STAT_CONFIG = [
  {
    key: 'totalCustomers',
    label: 'Total Users',
    bg: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    key: 'todayRegistrations',
    label: "Today's Registrations",
    bg: 'linear-gradient(135deg,#43e97b 0%,#38f9d7 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <path d="m9 16 2 2 4-4"/>
      </svg>
    ),
  },
  {
    key: 'totalReferrals',
    label: 'Total Referrals',
    bg: 'linear-gradient(135deg,#fa709a 0%,#fee140 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
  },
  {
    key: 'topReferrer',
    label: 'Top Referrer',
    bg: 'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    key: 'topUser',
    label: 'Top ID',
    bg: 'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
  {
    key: 'recentCustomer',
    label: 'Latest User',
    bg: 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  },
]

const fmtDate = (d) => {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}



export default function AdminDashboard() {
  const { adminUser } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [topUser, setTopUser] = useState(null)
  const [resetForm, setResetForm] = useState({
    topUserName: '',
    topUserEmail: '',
    topUserPhone: '',
    topUserPassword: '',
  })
  const [recentPage, setRecentPage] = useState(1)
  const [recentPageSize, setRecentPageSize] = useState(10)
  const navigate = useNavigate()

  const refreshDashboard = async () => {
    try {
      const [statsData, topIdData] = await Promise.all([fetchAdminStats(), fetchTopId()])
      setStats(statsData)
      setTopUser(topIdData.topUser)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refreshDashboard().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = () => refreshDashboard()
    window.addEventListener('topIdUpdated', handler)
    return () => window.removeEventListener('topIdUpdated', handler)
  }, [])

  const handleResetDB = async (e) => {
    e.preventDefault()
    try {
      const response = await resetDatabase(resetForm)
      setStats(prev => ({ ...prev, totalCustomers: 1, todayRegistrations: 1, recentCustomers: [response.topUser] }))
      setTopUser(response.topUser)
      setResetForm({ topUserName: '', topUserEmail: '', topUserPhone: '', topUserPassword: '' })
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return (
    <main className="page-shell layout-with-sidebar">
      <div className="ad-loading">
        <div className="ad-spinner" />
        <span>Loading dashboard…</span>
      </div>
    </main>
  )

  if (error) return (
    <main className="page-shell layout-with-sidebar">
      <div className="alert alert-danger"><p>{error}</p></div>
    </main>
  )

  const statValues = {
    totalCustomers:     stats.totalCustomers ?? 0,
    todayRegistrations: stats.todayRegistrations ?? 0,
    totalReferrals:     stats.totalReferrals ?? 0,
    topReferrer:        stats.topReferrer?.name || '—',
    topUser:            stats.topUser ? `${stats.topUser.userId || '#' + stats.topUser.id} · ${stats.topUser.name}` : '—',
    recentCustomer:     stats.recentCustomers?.[0]?.name || '—',
  }

  return (
    <main className="page-shell layout-with-sidebar">

      {/* ── Hero banner ── */}
      <div className="ad-hero">
        <div className="ad-hero-blob ad-blob1" />
        <div className="ad-hero-blob ad-blob2" />
        <div className="ad-hero-content">
          <div className="ad-hero-text">
            <h1 className="ad-hero-title">Admin Dashboard</h1>
            <p className="ad-hero-sub">Monitor registrations, referrals, and platform performance in real time.</p>
          </div>
        </div>
        <div className="ad-hero-illo" aria-hidden>
          <svg viewBox="0 0 220 140" fill="none" xmlns="http://www.w3.org/2000/svg" width="220">
            <rect x="30" y="20" width="160" height="100" rx="14" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            <rect x="30" y="20" width="160" height="32" rx="14" fill="rgba(255,255,255,0.15)"/>
            <rect x="30" y="40" width="160" height="12" fill="rgba(255,255,255,0.1)"/>
            <circle cx="50" cy="36" r="6" fill="rgba(255,255,255,0.5)"/>
            <circle cx="68" cy="36" r="6" fill="rgba(255,255,255,0.3)"/>
            <circle cx="86" cy="36" r="6" fill="rgba(255,255,255,0.2)"/>
            <rect x="46" y="66" width="36" height="8" rx="4" fill="rgba(255,255,255,0.35)"/>
            <rect x="46" y="80" width="52" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
            <rect x="46" y="94" width="28" height="8" rx="4" fill="rgba(255,255,255,0.2)"/>
            <rect x="120" y="62" width="52" height="44" rx="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            <rect x="128" y="74" width="36" height="6" rx="3" fill="rgba(255,255,255,0.4)"/>
            <rect x="128" y="86" width="24" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
            <rect x="128" y="98" width="30" height="6" rx="3" fill="rgba(255,255,255,0.25)"/>
          </svg>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="ad-stats">
        {STAT_CONFIG.map((cfg) => (
          <div key={cfg.key} className="ad-stat-card" style={{ background: cfg.bg }}>
            <div className="ad-stat-icon">{cfg.icon}</div>
            <div className="ad-stat-body">
              <div className="ad-stat-label">{cfg.label}</div>
              <div className="ad-stat-value">{statValues[cfg.key]}</div>
            </div>
          </div>
        ))}
      </div>

      
      {/* ── Recent customers table ── */}
      {/* <div className="ad-table-card">
        <div className="ad-table-header">
          <div>
            <h2 className="ad-table-title">Recent Customers</h2>
          </div>
          <button className="button button-secondary button-small" onClick={() => navigate('/admin/customers')}>
            View All
          </button>
        </div>

        
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentCustomers.length === 0 ? (
                <tr><td colSpan="5" style={{textAlign:'center',color:'var(--muted)',padding:'24px'}}>No customers yet.</td></tr>
              ) : (() => {
                const total = stats.recentCustomers.length
                const start = (recentPage - 1) * recentPageSize
                const paged = stats.recentCustomers.slice(start, start + recentPageSize)
                return paged.map((c, i) => (
                  <tr key={c.id} style={{ animationDelay: `${i * 50}ms` }} className="ad-table-row">
                    <td>
                      <span className="ad-cid-badge">{c.id}</span>
                    </td>
                    <td>
                      <div className="ad-name-cell">
                        <div className="ad-name-avatar">{c.name?.[0]?.toUpperCase()}</div>
                        <span>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>{fmtDate(c.regat || c.createdAt)}</td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
{/* 
        <div className="pagination-row">
          <button className="button button-secondary" disabled={recentPage <= 1} onClick={() => setRecentPage((p) => p - 1)}>Previous</button>
          <span>Page {recentPage} / {Math.ceil((stats.recentCustomers.length || 1) / recentPageSize) || 1}</span>
          <button className="button button-secondary" disabled={recentPage >= Math.ceil((stats.recentCustomers.length || 1) / recentPageSize)} onClick={() => setRecentPage((p) => p + 1)}>Next</button>
        </div> */}
      {/* </div>*/}

    </main>
  )

}
