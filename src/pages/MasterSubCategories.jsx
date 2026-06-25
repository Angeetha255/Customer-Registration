import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterSubCategories() {
  const [subcategories, setSubcategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingSubcategory, setDeletingSubcategory] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    categoryId: '',
    subcategoryName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchSubcategories()
    fetchCategories()
  }, [pagination.page, search])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE}/master-data/categories`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }

  const fetchSubcategories = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/subcategories/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setSubcategories(data.subcategories || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch subcategories')
      }
    } catch (err) {
      setError('Failed to fetch subcategories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingSubcategory
        ? `${API_BASE}/master-data/subcategories/${editingSubcategory.id}`
        : `${API_BASE}/master-data/subcategories`
      const method = editingSubcategory ? 'PUT' : 'POST'
      
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
        setToast({ message: data.message || 'Subcategory saved successfully', type: 'success' })
        setShowForm(false)
        setEditingSubcategory(null)
        setFormData({ categoryId: '', subcategoryName: '', status: 'active' })
        fetchSubcategories()
      } else {
        setError(data.message || 'Failed to save subcategory')
      }
    } catch (err) {
      setError('Failed to save subcategory')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory)
    setFormData({
      categoryId: subcategory.categoryId,
      subcategoryName: subcategory.subcategoryName,
      status: subcategory.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (subcategory) => {
    setDeletingSubcategory(subcategory)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSubcategory) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/subcategories/${deletingSubcategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'Subcategory deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingSubcategory(null)
        fetchSubcategories()
      } else {
        setError(data.message || 'Failed to delete subcategory')
      }
    } catch (err) {
      setError('Failed to delete subcategory')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (subcategory) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/subcategories/${subcategory.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          subcategoryName: subcategory.subcategoryName,
          status: subcategory.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchSubcategories()
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
    setEditingSubcategory(null)
    setFormData({ categoryId: '', subcategoryName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSubcategory(null)
    setFormData({ categoryId: '', subcategoryName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>SubCategories</h1>
        <p>Manage subcategory records</p>
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
              + Add SubCategory
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search subcategories..."
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
                  <th>Category</th>
                  <th>Subcategory Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading...</td>
                  </tr>
                ) : subcategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No subcategories found</td>
                  </tr>
                ) : (
                  subcategories.map((subcategory) => (
                    <tr key={subcategory.id}>
                      <td>{subcategory.id}</td>
                      <td>{subcategory.category?.categoryName || '-'}</td>
                      <td>{subcategory.subcategoryName}</td>
                      <td>
                        <button
                          className={`status-badge ${subcategory.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(subcategory)}
                        >
                          {subcategory.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(subcategory)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(subcategory)}
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
            <h2>{editingSubcategory ? 'Edit SubCategory' : 'Add SubCategory'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Category *
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.categoryName}</option>
                ))}
              </select>
            </label>
            <label>
              Subcategory Name *
              <input
                type="text"
                value={formData.subcategoryName}
                onChange={(e) => setFormData({ ...formData, subcategoryName: e.target.value })}
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
                {loading ? 'Saving...' : (editingSubcategory ? 'Update' : 'Add')}
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
              <p>Are you sure you want to delete <strong>{deletingSubcategory?.subcategoryName}</strong>?</p>
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
