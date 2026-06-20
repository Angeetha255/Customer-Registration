import { useEffect, useState } from 'react'
import { fetchLevelUsers } from '../services/api.js'

export default function MyTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadTeamMembers()
  }, [])

  const loadTeamMembers = async () => {
    try {
      setLoading(true)
      // Fetch all levels (1-10) and combine results
      const allMembers = []
      for (let level = 1; level <= 10; level++) {
        try {
          const data = await fetchLevelUsers(level)
          if (data.users && data.users.length > 0) {
            allMembers.push(...data.users)
          }
        } catch (err) {
          // Stop if no more levels
          break
        }
      }
      setMembers(allMembers)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="ad-loading"><div className="ad-spinner" /><span>Loading...</span></div>
      </main>
    )
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <div className="page-header">
        <h1>My Team</h1>
        <p>All team members with their details.</p>
      </div>

      {error && <div className="alert alert-danger"><p>{error}</p></div>}

      <div className="ad-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>User ID</th>
                <th>Ref ID</th>
                <th>Level</th>
                <th>Ref Count</th>
                <th>Team Count</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    No team members yet.
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr key={member.id}>
                    <td>{index + 1}</td>
                    <td><span className="ad-cid-badge">{member.userIdDisplay}</span></td>
                    <td>{member.refIdDisplay || '-'}</td>
                    <td>{member.level}</td>
                    <td>{member.refcount || 0}</td>
                    <td>{member.teamcount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
