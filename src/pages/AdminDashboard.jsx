import { useEffect, useState } from 'react'
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
      <section className="page-panel card">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Manage customer registrations, track growth, and review performance.</p>

        <div className="grid-card stats-grid">
          <div className="stat-card">
            <strong>Total Registered Customers</strong>
            <span>{stats.totalCustomers}</span>
          </div>
          <div className="stat-card">
            <strong>Today's Registrations</strong>
            <span>{stats.todayRegistrations}</span>
          </div>
          <div className="stat-card">
            <strong>Recent Customer</strong>
            <span>{stats.recentCustomers?.[0]?.name || 'No recent records'}</span>
          </div>
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
                  <th>Phone</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentCustomers.map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.customerId}</td>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone}</td>
                    <td>{new Date(customer.registeredAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card section-block">
          <h2>Growth</h2>
          <div className="growth-list">
            {stats.growth.map((item) => (
              <div key={item.date} className="growth-item">
                <span>{item.date}</span>
                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
