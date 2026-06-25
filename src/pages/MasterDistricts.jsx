import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterDistricts() {
  const [districts, setDistricts] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDistrict, setEditingDistrict] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingDistrict, setDeletingDistrict] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    stateId: '',
    districtName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchDistricts()
    fetchStates()
  }, [pagination.page, search])

  const fetchStates = async () => {
    try {
      const response = await fetch(`${API_BASE}/master-data/states`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setStates(data.states || [])
      }
    } catch (err) {
      console.error('Failed to fetch states:', err)
    }
  }

  const fetchDistricts = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/districts/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setDistricts(data.districts || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch districts')
      }
    } catch (err) {
      setError('Failed to fetch districts')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingDistrict
        ? `${API_BASE}/master-data/districts/${editingDistrict.id}`
        : `${API_BASE}/master-data/districts`
      const method = editingDistrict ? 'PUT' : 'POST'
      
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
        setToast({ message: data.message || 'District saved successfully', type: 'success' })
        setShowForm(false)
        setEditingDistrict(null)
        setFormData({ stateId: '', districtName: '', status: 'active' })
        fetchDistricts()
      } else {
        setError(data.message || 'Failed to save district')
      }
    } catch (err) {
      setError('Failed to save district')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (district) => {
    setEditingDistrict(district)
    setFormData({
      stateId: district.stateId,
      districtName: district.districtName,
      status: district.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (district) => {
    setDeletingDistrict(district)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingDistrict) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/districts/${deletingDistrict.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'District deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingDistrict(null)
        fetchDistricts()
      } else {
        setError(data.message || 'Failed to delete district')
      }
    } catch (err) {
      setError('Failed to delete district')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (district) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/districts/${district.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          districtName: district.districtName,
          status: district.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchDistricts()
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
    setEditingDistrict(null)
    setFormData({ stateId: '', districtName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingDistrict(null)
    setFormData({ stateId: '', districtName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Districts</h1>
        <p>Manage district records</p>
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
              + Add District
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search districts..."
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
                  <th>State</th>
                  <th>District Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading...</td>
                  </tr>
                ) : districts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No districts found</td>
                  </tr>
                ) : (
                  districts.map((district) => (
                    <tr key={district.id}>
                      <td>{district.id}</td>
                      <td>{district.state?.stateName || '-'}</td>
                      <td>{district.districtName}</td>
                      <td>
                        <button
                          className={`status-badge ${district.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(district)}
                        >
                          {district.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(district)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(district)}
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
            <h2>{editingDistrict ? 'Edit District' : 'Add District'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              State *
              <select
                value={formData.stateId}
                onChange={(e) => setFormData({ ...formData, stateId: e.target.value })}
                required
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.id} value={state.id}>{state.stateName}</option>
                ))}
              </select>
            </label>
            <label>
              District Name *
              <input
                type="text"
                value={formData.districtName}
                onChange={(e) => setFormData({ ...formData, districtName: e.target.value })}
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
                {loading ? 'Saving...' : (editingDistrict ? 'Update' : 'Add')}
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
              <p>Are you sure you want to delete <strong>{deletingDistrict?.districtName}</strong>?</p>
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
