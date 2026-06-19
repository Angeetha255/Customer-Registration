import { useEffect, useMemo, useState } from 'react'
import { fetchTeamView } from '../services/api.js'

export default function TeamView() {
  const [root, setRoot] = useState(null)
  const [levelSummary, setLevelSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const data = await fetchTeamView()
        setRoot(data.tree || null)
        setLevelSummary(data.levelSummary || [])
      } catch (err) {
        setError(err.message || 'Failed to load team view')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const [selectedMember, setSelectedMember] = useState(null)

  const handleMemberClick = (member) => {
    setSelectedMember(prev => prev?.id === member.id ? null : member)
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
            <span>Member ID</span>
            <strong>{root.userIdDisplay}</strong>
          </div>
          <div>
            <span>Name</span>
            <strong>{root.name || '-'}</strong>
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
                <th>S.NO</th>
                <th>MEMBER ID</th>
                <th>NAME</th>
                <th>SPONSOR</th>
                <th>STATUS</th>
                <th>LEVEL</th>
                <th>REFERRALS</th>
                <th>TEAM</th>
              </tr>
            </thead>

            <tbody>
              {selectedMember && (
                <tr className="selected-member-row">
                  <td>{filteredMembers.findIndex(m => m.id === selectedMember.id) + 1}</td>
                  <td>
                    <span className="ad-cid-badge">{selectedMember.userIdDisplay}</span>
                  </td>
                  <td>{selectedMember.name}</td>
                  <td>{selectedMember.referrerName || '-'}</td>
                  <td>
                    <span className={selectedMember.active ? 'status-active' : 'status-inactive'}>
                      {selectedMember.activeStatus}
                    </span>
                  </td>
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
                    onClick={() => handleMemberClick(member)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{index + 1}</td>
                    <td>
                      <span className="ad-cid-badge">{member.userIdDisplay}</span>
                    </td>
                    <td>{member.name}</td>
                    <td>{member.referrerName || '-'}</td>
                    <td>
                      <span className={member.active ? 'status-active' : 'status-inactive'}>
                        {member.activeStatus}
                      </span>
                    </td>
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