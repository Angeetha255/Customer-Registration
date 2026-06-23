import { useEffect, useState } from 'react'
import { fetchLevelUsers } from '../services/api.js'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function MyTeam() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

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

  const totalPages = Math.max(Math.ceil(members.length / pageSize), 1)
  const pagedMembers = members.slice((page - 1) * pageSize, page * pageSize)

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
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>User ID</th>
                <th>Sponsor User ID</th>
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
                pagedMembers.map((member, index) => (
                  <tr key={member.id}>
                    <td>{index + 1}</td>
                    <td><span className="ad-cid-badge">{member.userIdDisplay}</span> {member.joinerName || ''}</td>
                    <td>{member.sponsorUserIdDisplay || '-'} {member.sponsorName || ''}</td>
                    <td>{member.level}</td>
                    <td>{member.refactcount || 0}/{member.refcount || 0}</td>
                    <td>{member.teamactcount || 0}/{member.teamcount || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <button className="button button-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span>Page {page} / {totalPages}</span>
          <button className="button button-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      </div>
    </main>
  )
}