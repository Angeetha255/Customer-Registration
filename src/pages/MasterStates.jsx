import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterStates() {
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingState, setEditingState] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingState, setDeletingState] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    stateName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchStates()
  }, [pagination.page, search])

  const fetchStates = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/states/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setStates(data.states || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch states')
      }
    } catch (err) {
      setError('Failed to fetch states')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingState
        ? `${API_BASE}/master-data/states/${editingState.id}`
        : `${API_BASE}/master-data/states`
      const method = editingState ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(formData)
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'State saved successfully', type: 'success' })
        setShowForm(false)
        setEditingState(null)
        setFormData({ stateName: '', status: 'active' })
        fetchStates()
      } else {
        setError(data.message || 'Failed to save state')
      }
    } catch (err) {
      setError('Failed to save state')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (state) => {
    setEditingState(state)
    setFormData({
      stateName: state.stateName,
      status: state.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (state) => {
    setDeletingState(state)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingState) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/states/${deletingState.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'State deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingState(null)
        fetchStates()
      } else {
        setError(data.message || 'Failed to delete state')
      }
    } catch (err) {
      setError('Failed to delete state')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (state) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/states/${state.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          stateName: state.stateName,
          status: state.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchStates()
      } else {
        setError(data.message || 'Failed to update status')
      }
    } catch (err) {
      setError('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const openAddForm = () => {
    setEditingState(null)
    setFormData({ stateName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingState(null)
    setFormData({ stateName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>States</h1>
        <p>Manage state records</p>
      </div>

      {toast.message && (
        <div className={`alert alert-${toast.type}`}>
          <p>{toast.message}</p>
          <button onClick={() => setToast({ message: '', type: 'success' })}>✕</button>
        </div>
      )}

      {error && !toast.message && (
        <div className="alert alert-danger">
          <p>{error}</p>
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {!showForm ? (
        <>
          <div className="table-actions">
            <button className="button button-primary" onClick={openAddForm}>
              + Add State
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search states..."
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>State Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center">Loading...</td>
                  </tr>
                ) : states.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No states found</td>
                  </tr>
                ) : (
                  states.map((state) => (
                    <tr key={state.id}>
                      <td>{state.id}</td>
                      <td>{state.stateName}</td>
                      <td>
                        <button
                          className={`status-badge ${state.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(state)}
                        >
                          {state.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(state)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(state)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="button button-secondary button-small"
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="button button-secondary button-small"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="form-card">
          <div className="form-card-header">
            <h2>{editingState ? 'Edit State' : 'Add State'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              State Name *
              <input
                type="text"
                value={formData.stateName}
                onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                required
              />
            </label>
            <label>
              Status
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <div className="form-actions full-width">
              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Saving...' : (editingState ? 'Update' : 'Add')}
              </button>
            </div>
          </form>
        </div>
      )}

      {showDeleteModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}>
          <div className="modal-card modal-sm">
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deletingState?.stateName}</strong>?</p>
              <p className="text-muted">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="button button-muted" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="button button-danger" onClick={handleDeleteConfirm} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
