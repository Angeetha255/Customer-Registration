import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { fetchLevelSummary, fetchLevelUsers, fetchMe } from '../services/api.js'

export default function TeamView() {
  const { user } = useAuth()
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(null)
  const [levelUsers, setLevelUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [breadcrumbs, setBreadcrumbs] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [currentUserData, setCurrentUserData] = useState(null)

  useEffect(() => {
    loadSummary()
    fetchCurrentUser()
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const data = await fetchMe()
      setCurrentUserData(data)
    } catch (err) {
      console.error('Failed to fetch current user:', err)
    }
  }

  const loadSummary = async (userId = null) => {
    try {
      setLoading(true)
      const data = await fetchLevelSummary(userId)
      setSummary(data.summary || [])
      setSelectedLevel(null)
      setLevelUsers([])
      setCurrentUserId(userId)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewClick = async (level) => {
    setSelectedLevel(level)
    setLoadingUsers(true)
    try {
      const data = await fetchLevelUsers(level, currentUserId)
      setLevelUsers(data.users || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleUserClick = async (userId, userDisplayId, userName) => {
    try {
      setLoading(true)
      const data = await fetchLevelSummary(userId)
      setSummary(data.summary || [])
      setSelectedLevel(null)
      setLevelUsers([])
      setCurrentUserId(userId)
      setBreadcrumbs((prev) => [...prev, { userId, userDisplayId, userName }])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleBreadcrumbClick = async (index) => {
    try {
      setLoading(true)
      if (index === -1) {
        // Home - load current user's summary
        setBreadcrumbs([])
        setCurrentUserId(null)
        await loadSummary()
      } else {
        // Load clicked user's summary
        const crumb = breadcrumbs[index]
        const data = await fetchLevelSummary(crumb.userId)
        setSummary(data.summary || [])
        setSelectedLevel(null)
        setLevelUsers([])
        setCurrentUserId(crumb.userId)
        setBreadcrumbs((prev) => prev.slice(0, index + 1))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="ad-loading">
          <div className="ad-spinner" />
          <span>Loading...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <div className="page-header">
        <div>
          <h1>Team View</h1>
          {currentUserData && (
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>
              {currentUserData.name} ({currentUserData.userId || `#${currentUserData.id}`})
            </p>
          )}
        </div>
        {/* <p>Team members organized by referral level.</p> */}
      </div>

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div style={{ marginBottom: 12, padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 12 }}>
          <button
            type="button"
            onClick={() => handleBreadcrumbClick(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}
          >
            Team View
          </button>
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.userId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: 'var(--muted)' }}>&gt;</span>
              <button
                type="button"
                onClick={() => handleBreadcrumbClick(index)}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '2px 6px', fontSize: 12 }}
              >
                {crumb.userName} ({crumb.userDisplayId})
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Level Summary Table */}
      {!selectedLevel && (
        <div className="ad-table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Level</th>
                  <th>Active/Total</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {summary.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                      No team members yet.
                    </td>
                  </tr>
                ) : (
                  summary.map((item, index) => (
                    <tr key={item.level}>
                      <td>{index + 1}</td>
                      <td>Level {item.level}</td>
                      <td>{item.activeCount}/{item.totalCount}</td>
                      <td>
                        <button
                          type="button"
                          className="button button-secondary button-small"
                          onClick={() => handleViewClick(item.level)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Level Members Table */}
      {selectedLevel && (
        <div className="ad-table-card">
          <div className="table-header">
            <h3>Level {selectedLevel} Users</h3>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => setSelectedLevel(null)}
            >
              Back to Summary
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>User</th>
                  <th>Sponsor</th>
                  <th>Level</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>
                      Loading…
                    </td>
                  </tr>
                ) : levelUsers.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: '24px' }}>
                      No users found at this level.
                    </td>
                  </tr>
                ) : (
                  levelUsers.map((user, index) => (
                    <tr key={user.id}>
                      <td>{index + 1}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleUserClick(user.joinerId, user.userIdDisplay, user.joinerName)}
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                        >
                          {user.joinerName} ({user.userIdDisplay})
                        </button>
                      </td>
                       <td>
                        {user.sponsorName ? (
                          <button
                            type="button"
                            onClick={() => handleUserClick(user.sponsorId, user.sponsorUserIdDisplay, user.sponsorName)}
                            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: 0, fontSize: 'inherit' }}
                          >
                            {user.sponsorName} ({user.sponsorUserIdDisplay})
                          </button>
                        ) : '-'}
                      </td>
                      <td>{user.level}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}