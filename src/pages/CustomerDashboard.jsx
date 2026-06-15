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
      <section className="page-panel card">
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
                  <input readOnly value={`${window.location.origin}/register?ref=${profile.introducerId}`} style={{ width: '100%' }} />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/register?ref=${profile.introducerId}`)}
                    className="button"
                  >
                    Copy Link
                  </button>
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
      <section className="page-panel card">
        <h2>Referred Customers</h2>
        {referred.length === 0 ? (
          <p>No referrals yet.</p>
        ) : (
          <ul>
            {referred.map((r) => (
              <li key={r._id}>{r.name} — {r.email} — {r.phone}</li>
            ))}
          </ul>
        )}
      </section>
      </section>
    </main>
  )
}
