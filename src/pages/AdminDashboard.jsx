import { useEffect, useState } from 'react'
// Back button removed for Admin Dashboard UI
import { fetchAdminStats } from '../services/api.js'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAdminStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="page-panel">Loading admin dashboard...</div>
  }

  if (error) {
    return <div className="page-panel">{error}</div>
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <section className="page-panel card no-border-panel">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Manage customer registrations, track growth, and review performance.</p>

        <div className="dashboard-grid">
          {
            (() => {
              const cards = [
                {
                  key: 'totalCustomers',
                  label: 'Total Customers',
                  value: stats.totalCustomers ?? 0,
                  icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7v1H4v-1z" fill="#4F46E5"/></svg>)
                },
                {
                  key: 'todayRegistrations',
                  label: "Today's Registrations",
                  value: stats.todayRegistrations ?? 0,
                  icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#059669"/></svg>)
                },
                {
                  key: 'totalReferrals',
                  label: 'Total Referrals',
                  value: stats.totalReferrals ?? 0,
                  icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l-10 5 10 5 10-5-10-5z" fill="#F59E0B"/></svg>)
                },
                {
                  key: 'topReferrer',
                  label: 'Top Referrer',
                  value: stats.topReferrer?.name || '—',
                
                  icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7v1H4v-1z" fill="#EF4444"/></svg>)
                },
                {
                  key: 'recentCustomer',
                  label: 'Recent Customer',
                  value: stats.recentCustomers?.[0]?.name || 'No recent records',
                  icon: (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zM4 20c0-3.866 3.582-7 8-7s8 3.134 8 7v1H4v-1z" fill="#3B82F6"/></svg>)
                }
              ]

              const cells = cards.map((c) => (
                <div key={c.key} className={`stat-card ${c.key === 'topReferrer' ? 'stat-top-referrer' : ''}`}>
                  <div className="stat-icon" aria-hidden>{c.icon}</div>
                  <div className="stat-content">
                    <div className="stat-label">{c.label}</div>
                    <div className="stat-value">{c.value}</div>
                    {c.meta && <div className="stat-meta">{c.meta}</div>}
                    {c.meta2 && <div className="stat-meta">{c.meta2}</div>}
                  </div>
                </div>
              ))

              // Do not render placeholder cards; just return available cells.
              return cells
            })()
          }
        </div>

       <section className="card section-block">
          <h2>Recent Customers</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Registration Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCustomers.map((customer) => (
                  <tr key={customer.id || customer._id}>
                      <td>{customer.customerId || customer.id}</td>
                      <td>{customer.name}</td>
                      <td>{customer.email}</td>
                      <td>{customer.phone}</td>
                      <td>{(function(d){ if(!d) return '—'; const dt=new Date(d); return String(dt.getDate()).padStart(2,'0')+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+dt.getFullYear() })(customer.registeredAt || customer.createdAt)}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section> 
{/* 
        <section className="card section-block">
          <h2>Registration Analytics</h2>
          <p className="muted">Registration growth charts and analytics will be displayed here in future updates.</p>
        </section> */}
      </section>
    </main>
  )
}
