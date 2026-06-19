import { useEffect, useMemo, useState } from 'react'
import { fetchTeamView } from '../services/api.js'

export default function TeamView() {
  const [root, setRoot] = useState(null)
  const [levelSummary, setLevelSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [breadcrumbs, setBreadcrumbs] = useState([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchTeamView()
        setRoot(data.tree || null)
        setLevelSummary(data.levelSummary || [])
        setBreadcrumbs([])
      } catch (err) {
        setError(err.message || 'Failed to load team view')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const [selectedMember, setSelectedMember] = useState(null)
  const [selectedMemberSerial, setSelectedMemberSerial] = useState(null)

  const loadTeamView = async (userId) => {
    try {
      setLoading(true)
      const data = await fetchTeamView(userId)
      setRoot(data.tree || null)
      setLevelSummary(data.levelSummary || [])
    } catch (err) {
      setError(err.message || 'Failed to load team view')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberClick = (member, index) => {
    const isDeselecting = selectedMember?.id === member.id
    if (isDeselecting) {
      setSelectedMember(null)
      setSelectedMemberSerial(null)
      setBreadcrumbs([])
      loadTeamView()
    } else {
      setSelectedMember(member)
      setSelectedMemberSerial(index + 1)
      setRoot({
        id: member.id,
        userIdDisplay: member.userIdDisplay,
        name: member.name
      })
      setBreadcrumbs((prev) => [
        ...prev,
        { id: member.id, userIdDisplay: member.userIdDisplay, name: member.name },
      ])
      loadTeamView(member.id)
    }
  }

  const handleBreadcrumbClick = async (crumb, index) => {
    setSelectedMember(null)
    setSelectedMemberSerial(null)
    const newCrumbs = breadcrumbs.slice(0, index)
    setBreadcrumbs(newCrumbs)
    if (index === 0) {
      setRoot(null)
      await loadTeamView()
    } else {
      const target = newCrumbs[newCrumbs.length - 1]
      setRoot({
        id: target.id,
        userIdDisplay: target.userIdDisplay,
        name: target.name,
      })
      await loadTeamView(target.id)
    }
  }

  const members = useMemo(() => {
    const all = levelSummary.flatMap(level => level.members || [])
    // Exclude root user (current user) from the table
    return all.filter(m => m.id !== root?.id)
  }, [levelSummary, root])

  const filteredMembers = members

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
        <h1>Team View</h1>
      </div>

      {error && (
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      )}

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

      {breadcrumbs.length > 0 && (
        <div className="ad-table-card" style={{ marginBottom: 12 }}>
          
          <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="button button-secondary button-small"
              onClick={() => handleBreadcrumbClick({ id: null, userIdDisplay: 'All', name: 'All' }, 0)}
            >
              All
            </button>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--muted)' }}>/</span>
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() => handleBreadcrumbClick(crumb, index + 1)}
                >
                  {crumb.userIdDisplay}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="ad-table-card">

        <div className="table-header">
          <h3>Team Members</h3>
        </div>

        <div className="table-scroll">

          <table>

            <thead>
              <tr>
                {/* <th>S.NO</th> */}
                <th>USER ID</th>
                <th>NAME</th>
                <th>REFERRER</th>
                {/* <th>STATUS</th> */}
                <th>LEVEL</th>
                <th>REFERRALS</th>
                <th>TEAM</th>
              </tr>
            </thead>

            <tbody>
              {selectedMember && (
                <tr className="selected-member-row">
                  {/* <td>{selectedMemberSerial }</td> */}
                  <td>
                    <span className="ad-cid-badge">{selectedMember.userIdDisplay}</span>
                  </td>
                  <td>{selectedMember.name}</td>
                  <td>{selectedMember.referrerName || '-'}</td>
                  {/* <td>
                    <span className={selectedMember.active ? 'status-active' : 'status-inactive'}>
                      {selectedMember.activeStatus}
                    </span>
                  </td> */}
                  <td>Level {selectedMember.level}</td>
                  <td>{selectedMember.refStatus}</td>
                  <td>{selectedMember.teamStatus}</td>
                </tr>
              )}
              {filteredMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      textAlign: 'center',
                      padding: '25px'
                    }}
                  >
                    No members found
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr 
                    key={member.id} 
                    className={selectedMember?.id === member.id ? 'row-selected' : ''}
                    onClick={() => handleMemberClick(member, index)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* <td>{index + 1}</td> */}
                    <td>
                      <span className="ad-cid-badge">{member.userIdDisplay}</span>
                    </td>
                    <td>{member.name}</td>
                    <td>{member.referrerName || '-'}</td>
                    {/* <td>
                      <span className={member.active ? 'status-active' : 'status-inactive'}>
                        {member.activeStatus}
                      </span>
                    </td> */}
                    <td>Level {member.level}</td>
                    <td>{member.refStatus}</td>
                    <td>{member.teamStatus}</td>
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