import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterAreas() {
  const [areas, setAreas] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingArea, setEditingArea] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingArea, setDeletingArea] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    districtId: '',
    areaName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchAreas()
    fetchDistricts()
  }, [pagination.page, search])

  const fetchDistricts = async () => {
    try {
      const response = await fetch(`${API_BASE}/master-data/districts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setDistricts(data.districts || [])
      }
    } catch (err) {
      console.error('Failed to fetch districts:', err)
    }
  }

  const fetchAreas = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/areas/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setAreas(data.areas || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch areas')
      }
    } catch (err) {
      setError('Failed to fetch areas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingArea
        ? `${API_BASE}/master-data/areas/${editingArea.id}`
        : `${API_BASE}/master-data/areas`
      const method = editingArea ? 'PUT' : 'POST'
      
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
        setToast({ message: data.message || 'Area saved successfully', type: 'success' })
        setShowForm(false)
        setEditingArea(null)
        setFormData({ districtId: '', areaName: '', status: 'active' })
        fetchAreas()
      } else {
        setError(data.message || 'Failed to save area')
      }
    } catch (err) {
      setError('Failed to save area')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (area) => {
    setEditingArea(area)
    setFormData({
      districtId: area.districtId,
      areaName: area.areaName,
      status: area.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (area) => {
    setDeletingArea(area)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingArea) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/areas/${deletingArea.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'Area deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingArea(null)
        fetchAreas()
      } else {
        setError(data.message || 'Failed to delete area')
      }
    } catch (err) {
      setError('Failed to delete area')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (area) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/areas/${area.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          areaName: area.areaName,
          status: area.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchAreas()
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
    setEditingArea(null)
    setFormData({ districtId: '', areaName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingArea(null)
    setFormData({ districtId: '', areaName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Areas</h1>
        <p>Manage area records</p>
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
              + Add Area
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search areas..."
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
                  <th>District</th>
                  <th>Area Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center">Loading...</td>
                  </tr>
                ) : areas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center">No areas found</td>
                  </tr>
                ) : (
                  areas.map((area) => (
                    <tr key={area.id}>
                      <td>{area.id}</td>
                      <td>{area.district?.state?.stateName || '-'}</td>
                      <td>{area.district?.districtName || '-'}</td>
                      <td>{area.areaName}</td>
                      <td>
                        <button
                          className={`status-badge ${area.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(area)}
                        >
                          {area.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(area)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(area)}
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
            <h2>{editingArea ? 'Edit Area' : 'Add Area'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              District *
              <select
                value={formData.districtId}
                onChange={(e) => setFormData({ ...formData, districtId: e.target.value })}
                required
              >
                <option value="">Select District</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>{district.districtName}</option>
                ))}
              </select>
            </label>
            <label>
              Area Name *
              <input
                type="text"
                value={formData.areaName}
                onChange={(e) => setFormData({ ...formData, areaName: e.target.value })}
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
                {loading ? 'Saving...' : (editingArea ? 'Update' : 'Add')}
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
              <p>Are you sure you want to delete <strong>{deletingArea?.areaName}</strong>?</p>
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
