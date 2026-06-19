import { useEffect, useState } from 'react'
import { fetchMyDirect } from '../services/api.js'

export default function MyDirect() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMyDirect()
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
        <h1>My Direct</h1>
        <p>Users who registered directly using your referral link.</p>
      </div>

      <div className="ad-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th rowSpan={2}>User ID</th>
                <th rowSpan={2}>Name</th>
                {/* <th>Ref ID</th> */}
                <th colSpan={2}>Status</th>
                
                <th rowSpan={2}>DOJ</th>
                <th rowSpan={2}>DOA</th>
              </tr>
              <tr>
                <th>Team</th>
                <th>Referral</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    No direct referrals yet.
                  </td>
                </tr>
              ) : members.map((m) => (
                <tr key={m.id}>
                  <td><span className="ad-cid-badge">{m.userIdDisplay}</span></td>
                  <td>{m.name || '-'}</td>
                  {/* <td>{m.refIdDisplay}</td> */}
                  <td>{m.teamStatus}</td>
                  <td>{m.refStatus}</td>
                  <td>{m.DOJDisplay}</td>
                  <td>{m.DOADisplay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}