import { useAuth } from '../context/AuthContext.jsx'
import { useEffect, useState } from 'react'
import { fetchReferredCustomers } from '../services/api.js'

export default function CustomerDashboard() {
  const { user } = useAuth()

  if (!user) {
    return <div className="page-panel">Loading dashboard...</div>
  }
  const profile = user
  const [referred, setReferred] = useState([])

  useEffect(() => {
    const loadReferred = async () => {
      try {
        const data = await fetchReferredCustomers()
        setReferred(data.referred || [])
      } catch (err) {
        setReferred([])
      }
    }
    loadReferred()
  }, [])

  return (
    <main className="page-shell layout-with-sidebar">
      <section className="page-panel card no-border-panel">
        <h1>Customer Dashboard</h1>
        <p className="subtitle">Your profile and registration details are shown below.</p>
        <div className="grid-card">
          <div>
            <strong>Name</strong>
            <span>{profile.name}</span>
          </div>
          <div>
            <strong>Email</strong>
            <span>{profile.email}</span>
          </div>
          <div>
            <strong>Phone</strong>
            <span>{profile.phone}</span>
          </div>
          <div>
            <strong>My Introducer ID</strong>
            <span>{profile.introducerId || 'Pending'}</span>
          </div>
          <div>
            <strong>My Referral Link</strong>
            <span>
              {profile.introducerId ? (
                <>
                  <input
                    readOnly
                    className="referral-input"
                    value={`${window.location.origin}/register?ref=${profile.introducerId}`}
                    style={{ width: '100%' }}
                    onClick={(e) => {
                      // Prevent any default navigation or propagation from clicks
                      e.preventDefault()
                      e.stopPropagation()
                      try {
                        e.target.select()
                      } catch {}
                    }}
                  />
                  
                </>
              ) : (
                'Pending'
              )}
            </span>
          </div>
         
          <div>
            <strong>Total Referrals</strong>
            <span>{profile.referralCount ?? 0}</span>
          </div>
          <div>
            <strong>Registration Date</strong>
            <span>{new Date(profile.registeredAt).toLocaleString()}</span>
          </div>
        </div>
        {/* Referral actions placed under the referral card and above referred customers */}
        {profile.introducerId && (
          <div className="ref-actions" style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${profile.introducerId}`)}
              className="button"
            >
              Copy Link
            </button>
            <button
              type="button"
              onClick={() => window.open(`${window.location.origin}/register?ref=${profile.introducerId}`, '_blank')}
              className="button button-secondary"
            >
              Open Link
            </button>
          </div>
        )}
      <section className="page-panel card">
        <h2>Referred Customers</h2>
        {referred.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <ul className="referred-list">
            {referred.map((r) => (
              <li key={r.id || r._id} className="referred-item no-border-item">
                <div className="ref-main">
                  <div className="ref-name">{r.name}</div>
                  <div className="ref-email">{r.email}</div>
                  <div className="ref-meta">Registered: {(function(d){ if(!d) return '—'; const dt=new Date(d); return String(dt.getDate()).padStart(2,'0')+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+dt.getFullYear() })(r.registeredAt || r.createdAt)}</div>
                </div>
                <div className="ref-phone">{r.phone}</div>
              </li>
            ))}
          </ul>
        )}
      </section>
      </section>
    </main>
  )
}
