import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchMyTeam } from '../services/api.js'

const PAGE_SIZE = 10

export default function MyTeam() {
  const [searchParams] = useSearchParams()
  const levelParam = searchParams.get('level')

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedLevel, setSelectedLevel] = useState(levelParam ? parseInt(levelParam, 10) : null)
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  })

  useEffect(() => {
    let cancelled = false

    const params = { search, page, limit: PAGE_SIZE }
    if (selectedLevel) {
      params.level = selectedLevel
    }

    fetchMyTeam(params)
      .then((data) => {
        if (cancelled) return
        setMembers(data.members || [])
        setPagination({
          total: data.total || 0,
          page: data.page || page,
          limit: data.limit || PAGE_SIZE,
          totalPages: data.totalPages || 1,
        })
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [search, page, selectedLevel])

  const handleSearch = (event) => {
    event.preventDefault()
    const nextSearch = searchInput.trim()
    if (nextSearch === search && page === 1) return
    setLoading(true)
    setError('')
    setPage(1)
    setSearch(nextSearch)
  }

  const clearSearch = () => {
    if (!search && page === 1) return
    setLoading(true)
    setError('')
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  if (loading && !members.length) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="ad-loading"><div className="ad-spinner" /><span>Loading...</span></div>
      </main>
    )
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <div className="page-header">
        <h1>{selectedLevel ? `Level Details - Level ${selectedLevel}` : 'My Team'}</h1>
        <p>Referral hierarchy from Top ID through your upline, plus your full referral downline.</p>
      </div>

      {error && <div className="alert alert-danger"><p>{error}</p></div>}

      <div className="tv-search-card">
        <form className="tv-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by User ID"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
          {search && (
            <button type="button" className="button button-secondary" onClick={clearSearch}>
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="ad-table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>User ID</th>
                <th>Ref ID</th>
                <th>Level</th>
                <th>Ref Status</th>
                <th>Team Status</th>
                <th>Active Status</th>
                <th>DOJ</th>
                <th>DOA</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                    No records found.
                  </td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <span className="ad-cid-badge">{member.userIdNameDisplay || member.userIdDisplay}</span>
                  </td>
                  <td>{member.refIdNameDisplay || member.refIdDisplay}</td>
                  <td>{member.level}</td>
                  <td>{member.refStatus || '-'}</td>
                  <td>{member.teamStatus || '-'}</td>
                  <td>
                    <span className={`status-badge ${member.active ? 'status-active' : 'status-inactive'}`}>
                      {member.activeStatus}
                    </span>
                  </td>
                  <td>{member.DOJDisplay || '-'}</td>
                  <td>{member.DOADisplay || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <button
            type="button"
            className="button button-secondary"
            disabled={page <= 1 || loading}
            onClick={() => {
              setLoading(true)
              setError('')
              setPage((value) => Math.max(value - 1, 1))
            }}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
          </span>
          <button
            type="button"
            className="button button-secondary"
            disabled={page >= pagination.totalPages || loading}
            onClick={() => {
              setLoading(true)
              setError('')
              setPage((value) => value + 1)
            }}
          >
            Next
          </button>
        </div>
      </div>
    </main>
  )
}