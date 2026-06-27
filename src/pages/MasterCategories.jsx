import { useState, useEffect } from 'react'
import { API_BASE } from '../services/api.js'

export default function MasterCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const [formData, setFormData] = useState({
    categoryName: '',
    status: 'active'
  })

  useEffect(() => {
    fetchCategories()
  }, [pagination.page, search])

  const fetchCategories = async () => {
    setLoading(true)
    setError('')
    try {
      const url = `${API_BASE}/master-data/categories/all?page=${pagination.page}&limit=${pagination.limit}&search=${search}`
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCategories(data.categories || [])
        setPagination(data.pagination || pagination)
      } else {
        setError(data.message || 'Failed to fetch categories')
      }
    } catch (err) {
      setError('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const url = editingCategory
        ? `${API_BASE}/master-data/categories/${editingCategory.id}`
        : `${API_BASE}/master-data/categories`
      const method = editingCategory ? 'PUT' : 'POST'
      
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
        setToast({ message: data.message || 'Category saved successfully', type: 'success' })
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ categoryName: '', status: 'active' })
        fetchCategories()
      } else {
        setError(data.message || 'Failed to save category')
      }
    } catch (err) {
      setError('Failed to save category')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      categoryName: category.categoryName,
      status: category.status
    })
    setShowForm(true)
  }

  const handleDeleteClick = (category) => {
    setDeletingCategory(category)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/categories/${deletingCategory.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: data.message || 'Category deleted successfully', type: 'success' })
        setShowDeleteModal(false)
        setDeletingCategory(null)
        fetchCategories()
      } else {
        setError(data.message || 'Failed to delete category')
      }
    } catch (err) {
      setError('Failed to delete category')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusToggle = async (category) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}/master-data/categories/${category.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          categoryName: category.categoryName,
          status: category.status === 'active' ? 'inactive' : 'active'
        })
      })
      const data = await response.json()
      
      if (response.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' })
        fetchCategories()
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
    setEditingCategory(null)
    setFormData({ categoryName: '', status: 'active' })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ categoryName: '', status: 'active' })
    setError('')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Categories</h1>
        <p>Manage category records</p>
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
              + Add Category
            </button>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search categories..."
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
                  <th>Category Name</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center">Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center">No categories found</td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.id}</td>
                      <td>{category.categoryName}</td>
                      <td>
                        <button
                          className={`status-badge ${category.status === 'active' ? 'status-active' : 'status-inactive'}`}
                          onClick={() => handleStatusToggle(category)}
                        >
                          {category.status}
                        </button>
                      </td>
                      <td>
                        <button
                          className="button button-small button-secondary"
                          onClick={() => handleEdit(category)}
                        >
                          Edit
                        </button>
                        <button
                          className="button button-small button-danger"
                          onClick={() => handleDeleteClick(category)}
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
            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <button className="button button-muted" onClick={closeForm}>Cancel</button>
          </div>
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Category Name *
              <input
                type="text"
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
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
                {loading ? 'Saving...' : (editingCategory ? 'Update' : 'Add')}
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
              <p>Are you sure you want to delete <strong>{deletingCategory?.categoryName}</strong>?</p>
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
