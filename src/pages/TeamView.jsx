import { useCallback, useEffect, useState } from 'react'
import {
  fetchTeamView,
  fetchTeamViewChildren,
  searchTeamView,
} from '../services/api.js'

function TreeNode({ node, depth = 0, defaultExpanded = depth < 2 }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [children, setChildren] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadChildren = useCallback(async () => {
    if (children !== null) return
    setLoading(true)
    try {
      const data = await fetchTeamViewChildren(node.id)
      setChildren(data.children || [])
    } catch {
      setChildren([])
    } finally {
      setLoading(false)
    }
  }, [node.id, children])

  useEffect(() => {
    if (defaultExpanded && node.hasChildren && children === null) {
      loadChildren()
    }
  }, [defaultExpanded, node.hasChildren, children, loadChildren])

  const toggle = async () => {
    if (!expanded && node.hasChildren) {
      await loadChildren()
    }
    setExpanded((v) => !v)
  }

  const hasLoadedChildren = children && children.length > 0
  const showExpand = node.hasChildren || hasLoadedChildren

  return (
    <div className="tv-node" style={{ marginLeft: depth * 24 }}>
      <div className={`tv-node-card ${node.active ? '' : 'tv-inactive'}`}>
        <div className="tv-node-header">
          {showExpand ? (
            <button type="button" className="tv-expand-btn" onClick={toggle} aria-label={expanded ? 'Collapse' : 'Expand'}>
              {loading ? '…' : expanded ? '−' : '+'}
            </button>
          ) : (
            <span className="tv-expand-spacer" />
          )}
          <div className="tv-node-info">
            <div className="tv-node-title">
              <span className="tv-user-id">{node.userIdDisplay}</span>
              {node.position && <span className="tv-position">{node.position}</span>}
              <span className={`status-badge ${node.active ? 'status-active' : 'status-inactive'}`}>
                {node.activeStatus}
              </span>
            </div>
            <div className="tv-node-meta">
              <span>Placement: {node.placementIdDisplay}</span>
              <span>Ref: {node.refStatus}</span>
              <span>Team: {node.teamStatus}</span>
            </div>
          </div>
        </div>
      </div>

      {expanded && children && children.length > 0 && (
        <div className="tv-children">
          {children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeamView() {
  const [root, setRoot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchTeamView()
      .then((data) => setRoot(data.tree))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const data = await searchTeamView(searchQuery.trim())
      setSearchResults(data.results || [])
    } catch (err) {
      setSearchResults([])
      setError(err.message)
    } finally {
      setSearching(false)
    }
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
        <p>Genealogy tree visualization with expand/collapse.</p>
      </div>

      {error && <div className="alert alert-danger"><p>{error}</p></div>}

      <div className="tv-search-card">
        <form onSubmit={handleSearch} className="tv-search-form">
          <input
            type="text"
            placeholder="Search by User ID…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="button button-primary" disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => { setSearchResults(null); setSearchQuery('') }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {searchResults !== null ? (
        <div className="ad-table-card">
          <h2 className="ad-table-title">Search Results ({searchResults.length})</h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Position</th>
                  <th>Placement ID</th>
                  <th>Active Status</th>
                  <th>Ref Status</th>
                  <th>Team Status</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 ? (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>No matches found.</td></tr>
                ) : searchResults.map((r) => (
                  <tr key={r.id}>
                    <td>{r.userIdDisplay}</td>
                    <td>{r.position || '—'}</td>
                    <td>{r.placementIdDisplay}</td>
                    <td>{r.activeStatus}</td>
                    <td>{r.refStatus}</td>
                    <td>{r.teamStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : root ? (
        <div className="tv-tree-container">
          <TreeNode node={root} depth={0} defaultExpanded={true} />
        </div>
      ) : (
        <div className="ad-no-data">No tree data available.</div>
      )}
    </main>
  )
}
