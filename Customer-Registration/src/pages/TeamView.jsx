import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchTeamView,
} from '../services/api.js'

export default function TeamView() {
  const navigate = useNavigate()
  const [root, setRoot] = useState(null)
  const [levelSummary, setLevelSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchTeamView()
      .then((data) => {
        setRoot(data.tree)
        setLevelSummary(data.levelSummary || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleLevelClick = (level) => {
    navigate(`/my-team?level=${level.level}`)
  }

  if (loading) {
    return (
      <main className="page-shell layout-with-sidebar">
        <div className="ad-loading"><div className="ad-spinner" /><span>Loading…</span></div>
      </main>
    )
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <div className="page-header">
        <h1>Team View</h1>
      </div>

      {error && <div className="alert alert-danger"><p>{error}</p></div>}

      {root && (
        <div className="tv-profile-card">
          <div>
            <span>User ID</span>
            <strong>{root.userIdDisplay}</strong>
          </div>
          <div>
            <span>Name</span>
            <strong>{root.name || '-'}</strong>
          </div>
        </div>
      )}

      <div className="ad-table-card tv-level-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th>Members</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {levelSummary.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                    No level data available.
                  </td>
                </tr>
              ) : levelSummary.map((level) => (
                <tr key={level.level}>
                  <td>{level.level}</td>
                  <td>{level.activeCount} / {level.totalCount}</td>
                  <td>
                    <button
                      type="button"
                      className="tv-arrow-btn"
                      onClick={() => handleLevelClick(level)}
                      aria-label={`View level ${level.level}`}
                      title={`View level ${level.level}`}
                    >
                      ▶
                    </button>
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