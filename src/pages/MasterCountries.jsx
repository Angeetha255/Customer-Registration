import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterCountries() {
  const [countries, setCountries] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCountry, setEditingCountry] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCountry, setDeletingCountry] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    countryName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchCountries()
  }, [pagination.page, search])

  const fetchCountries = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/countries/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCountries(data.countries || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch countries')
      }
    } catch (err) {
      setError('Failed to fetch countries')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingCountry
        ? `${API_BASE}/master-data/countries/${editingCountry.id}`
        : `${API_BASE}/master-data/countries`
      const method = editingCountry ? 'PUT' : 'POST'
      
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
        setToast({ message: data.message || 'Country saved successfully', type: 'success' })
        setShowForm(false)
        setEditingCountry(null)
        setFormData({ countryName: '', status: 'active' })
        fetchCountries()
      } else {
        setError(data.message || 'Failed to save country')
      }
    } catch (err) {
      setError('Failed to save country')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (country) => {
    setEditingCountry(country)
    setFormData({
      countryName: country.countryName,
      status: country.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (country) => {
    setDeletingCountry(country)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCountry) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/countries/${deletingCountry.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'Country deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingCountry(null)
        fetchCountries()
      } else {
        setError(data.message || 'Failed to delete country')
      }
    } catch (err) {
      setError('Failed to delete country')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (country) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/countries/${country.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          countryName: country.countryName,
          status: country.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchCountries()
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
    setEditingCountry(null)
    setFormData({ countryName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCountry(null)
    setFormData({ countryName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Countries</h1>
        <p>Manage country records</p>
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
              + Add Country
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search countries..."
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
                  <th>Country Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center">Loading...</td>
                  </tr>
                ) : countries.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No countries found</td>
                  </tr>
                ) : (
                  countries.map((country) => (
                    <tr key={country.id}>
                      <td>{country.id}</td>
                      <td>{country.countryName}</td>
                      <td>
                        <button
                          className={`status-badge ${country.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(country)}
                        >
                          {country.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(country)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(country)}
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
            <h2>{editingCountry ? 'Edit Country' : 'Add Country'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Country Name *
              <input
                type="text"
                value={formData.countryName}
                onChange={(e) => setFormData({ ...formData, countryName: e.target.value })}
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
                {loading ? 'Saving...' : (editingCountry ? 'Update' : 'Add')}
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
              <p>Are you sure you want to delete <strong>{deletingCountry?.countryName}</strong>?</p>
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
