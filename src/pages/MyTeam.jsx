import { useEffect, useState } from 'react'
import { fetchMyTeam } from '../services/api.js'

export default function MyTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyTeam()
      .then((data) => setMembers(data.members || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="ad-loading"><div className="ad-spinner" /><span>Loading…</span></div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="alert alert-danger"><p>{error}</p></div>
      </main>
    )
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <div className="page-header">
        <h1>My Team</h1>
        <p>Complete downline hierarchy — direct and indirect referrals.</p>
      </div>

      <div className="ad-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Ref ID</th>
                <th>Placement ID</th>
                <th>Position</th>
                <th>Team Status</th>
                <th>Ref Status</th>
                <th>DOJ</th>
                <th>DOA</th>
                <th>Active Status</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    No team members yet.
                  </td>
                </tr>
              ) : members.map((m) => (
                <tr key={m.id}>
                  <td><span className="ad-cid-badge">{m.userIdDisplay}</span></td>
                  <td>{m.refIdDisplay}</td>
                  <td>{m.placementIdDisplay}</td>
                  <td>{m.position || '—'}</td>
                  <td>{m.teamStatus}</td>
                  <td>{m.refStatus}</td>
                  <td>{m.DOJDisplay}</td>
                  <td>{m.DOADisplay}</td>
                  <td>
                    <span className={`status-badge ${m.active ? 'status-active' : 'status-inactive'}`}>
                      {m.activeStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
