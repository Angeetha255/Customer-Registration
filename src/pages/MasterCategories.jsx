import { useState, useEffect, useRef } from 'react'
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

  // Multiple banner images state
  const [bannerFiles, setBannerFiles] = useState([])         // New files to upload
  const [bannerPreviews, setBannerPreviews] = useState([])   // All preview URLs (existing + new)
  const [existingBanners, setExistingBanners] = useState([]) // Existing banner URLs from DB
  const [bannersToRemove, setBannersToRemove] = useState([]) // Indices of existing banners to remove
  const fileInputRef = useRef(null)

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

  // Get banner images array (handles both old and new format)
  const getBannerArray = (category) => {
    if (category.bannerImages && Array.isArray(category.bannerImages) && category.bannerImages.length > 0) {
      return category.bannerImages
    }
    if (category.bannerImage) {
      return [category.bannerImage]
    }
    return []
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

      // Create FormData for multipart upload
      const formDataToSend = new FormData()
      formDataToSend.append('categoryName', formData.categoryName)
      formDataToSend.append('status', formData.status)

      // Append new banner files
      bannerFiles.forEach(file => {
        formDataToSend.append('bannerImages', file)
      })

      // Handle existing banners order (for edit mode)
      if (editingCategory && existingBanners.length > 0) {
        formDataToSend.append('existingBanners', JSON.stringify(existingBanners))
      }

      // Handle banner removals (for edit mode)
      if (editingCategory && bannersToRemove.length > 0) {
        bannersToRemove.forEach(index => {
          formDataToSend.append('removeBanner', 'true')
          formDataToSend.append('removeBannerIndex', index.toString())
        })
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: formDataToSend
      })

      const data = await response.json()

      if (response.ok) {
        setToast({ message: data.message || 'Category saved successfully', type: 'success' })
        setShowForm(false)
        setEditingCategory(null)
        setFormData({ categoryName: '', status: 'active' })
        resetBannerState()
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

  const resetBannerState = () => {
    setBannerFiles([])
    setBannerPreviews([])
    setExistingBanners([])
    setBannersToRemove([])
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      categoryName: category.categoryName,
      status: category.status
    })

    // Load existing banners
    const banners = getBannerArray(category)
    setExistingBanners([...banners])
    setBannerPreviews([...banners])
    setBannerFiles([])
    setBannersToRemove([])

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
      const response = await fetch(`${API_BASE}/master-data/categories/${category.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
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

  // Handle file selection for multiple banners
  const handleBannerFilesSelect = (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    const validFiles = []
    const errors = []

    files.forEach(file => {
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.`)
        return
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size too large. Maximum size is 5MB.`)
        return
      }
      validFiles.push(file)
    })

    if (errors.length > 0) {
      setError(errors.join('\n'))
    }

    if (validFiles.length === 0) return

    // Add new files to state
    setBannerFiles(prev => [...prev, ...validFiles])

    // Create previews for new files
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setBannerPreviews(prev => [...prev, ...newPreviews])

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Remove a banner by its index in the preview list
  const handleRemoveBanner = (index) => {
    const totalExisting = existingBanners.length

    if (index < totalExisting) {
      // It's an existing banner - mark for removal
      setBannersToRemove(prev => [...prev, index])
      setExistingBanners(prev => prev.filter((_, i) => i !== index))
    } else {
      // It's a newly added file - remove it
      const newFileIndex = index - totalExisting
      setBannerFiles(prev => prev.filter((_, i) => i !== newFileIndex))
    }

    // Remove preview
    setBannerPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // Replace a banner at a specific index
  const handleReplaceBanner = (index, e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPG, JPEG, PNG, and WEBP are allowed.')
      return
    }
    if (file.size > maxSize) {
      setError('File size too large. Maximum size is 5MB.')
      return
    }

    const totalExisting = existingBanners.length

    if (index < totalExisting) {
      // Replace existing banner - mark old one for removal and add new file
      setBannersToRemove(prev => [...prev, index])
      setExistingBanners(prev => prev.filter((_, i) => i !== index))
    } else {
      // Replace newly added file
      const newFileIndex = index - totalExisting
      setBannerFiles(prev => prev.filter((_, i) => i !== newFileIndex))
    }

    // Add new file
    setBannerFiles(prev => [...prev, file])

    // Update preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setBannerPreviews(prev => {
        const updated = [...prev]
        updated[index] = reader.result
        return updated
      })
    }
    reader.readAsDataURL(file)

    e.target.value = ''
  }

  // Move banner up in order (swap with previous)
  const handleMoveUp = (index) => {
    if (index === 0) return
    setBannerPreviews(prev => {
      const updated = [...prev]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
      return updated
    })
    // Also swap in existing banners if applicable
    const totalExisting = existingBanners.length
    if (index < totalExisting && index - 1 < totalExisting) {
      setExistingBanners(prev => {
        const updated = [...prev]
        ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
        return updated
      })
    }
  }

  // Move banner down in order (swap with next)
  const handleMoveDown = (index) => {
    if (index === bannerPreviews.length - 1) return
    setBannerPreviews(prev => {
      const updated = [...prev]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      return updated
    })
    // Also swap in existing banners if applicable
    const totalExisting = existingBanners.length
    if (index < totalExisting && index + 1 < totalExisting) {
      setExistingBanners(prev => {
        const updated = [...prev]
        ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
        return updated
      })
    }
  }

  // Drag-and-drop handlers
  const [dragIndex, setDragIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleDragStart = (index) => {
    setDragIndex(index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (index) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    // Reorder previews
    setBannerPreviews(prev => {
      const updated = [...prev]
      const [movedItem] = updated.splice(dragIndex, 1)
      updated.splice(index, 0, movedItem)
      return updated
    })

    // Reorder existing banners
    const totalExisting = existingBanners.length
    if (dragIndex < totalExisting && index < totalExisting) {
      setExistingBanners(prev => {
        const updated = [...prev]
        const [movedItem] = updated.splice(dragIndex, 1)
        updated.splice(index, 0, movedItem)
        return updated
      })
    } else if (dragIndex < totalExisting) {
      // Drag from existing to new - complex, just handle preview reorder
    }

    setDragIndex(null)
    setDragOverIndex(null)
  }

  const openAddForm = () => {
    setEditingCategory(null)
    setFormData({ categoryName: '', status: 'active' })
    resetBannerState()
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormData({ categoryName: '', status: 'active' })
    resetBannerState()
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
          <p style={{ whiteSpace: 'pre-wrap' }}>{error}</p>
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
                  <th>Banners</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center">Loading...</td>
                  </tr>
                ) : categories.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center">No categories found</td>
                  </tr>
                ) : (
                  categories.map((category) => {
                    const banners = getBannerArray(category)
                    return (
                      <tr key={category.id}>
                        <td>{category.id}</td>
                        <td>{category.categoryName}</td>
                        <td>
                          {banners.length > 0 ? (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {banners.map((banner, i) => (
                                <img
                                  key={i}
                                  src={banner}
                                  alt={`${category.categoryName} banner ${i + 1}`}
                                  style={{
                                    width: '60px',
                                    height: '40px',
                                    objectFit: 'cover',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                  }}
                                  title={`Banner ${i + 1}`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '0.85rem' }}>No banners</span>
                          )}
                          {banners.length > 1 && (
                            <span style={{ fontSize: '0.75rem', color: '#666', display: 'block', marginTop: '4px' }}>
                              {banners.length} banners
                            </span>
                          )}
                        </td>
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
                    )
                  })
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

            {/* Multiple Banner Images Upload */}
            <div className="full-width">
              <label style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                Banner Images (JPG, JPEG, PNG, WEBP - Max 5MB each, up to 10 images)
              </label>

              {/* Upload button */}
              <div
                style={{
                  border: '2px dashed #ccc',
                  borderRadius: '8px',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#fafafa',
                  transition: 'border-color 0.2s',
                  marginBottom: '1rem'
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#4A90D9' }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = '#ccc' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = '#ccc'
                  if (e.dataTransfer.files.length > 0) {
                    handleBannerFilesSelect({ target: { files: e.dataTransfer.files } })
                  }
                }}
              >
                <p style={{ fontSize: '2rem', margin: '0 0 0.5rem 0', color: '#999' }}>📁</p>
                <p style={{ margin: '0', color: '#666' }}>Click or drag & drop banner images here</p>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#999' }}>
                  JPG, JPEG, PNG, WEBP up to 5MB each
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  multiple
                  onChange={handleBannerFilesSelect}
                  style={{ display: 'none' }}
                />
              </div>

              {/* Banner Previews with Drag & Drop */}
              {bannerPreviews.length > 0 && (
                <div>
                  <p style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
                    Banner Previews ({bannerPreviews.length} images)
                    <span style={{ fontWeight: 'normal', fontSize: '0.85rem', color: '#666', marginLeft: '0.5rem' }}>
                      - Drag to reorder
                    </span>
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {bannerPreviews.map((preview, index) => {
                      const isExisting = index < existingBanners.length
                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={() => handleDrop(index)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.75rem',
                            border: `2px solid ${dragOverIndex === index ? '#4A90D9' : '#e0e0e0'}`,
                            borderRadius: '8px',
                            backgroundColor: dragOverIndex === index ? '#f0f7ff' : '#fff',
                            opacity: dragIndex === index ? 0.5 : 1,
                            transition: 'all 0.2s',
                            cursor: 'grab'
                          }}
                        >
                          {/* Drag handle */}
                          <span style={{ color: '#999', fontSize: '1.25rem', cursor: 'grab', userSelect: 'none' }}>
                            ⠿
                          </span>

                          {/* Banner number */}
                          <span style={{
                            fontWeight: '600',
                            color: '#666',
                            minWidth: '24px',
                            fontSize: '0.9rem'
                          }}>
                            #{index + 1}
                          </span>

                          {/* Image preview */}
                          <img
                            src={preview}
                            alt={`Banner ${index + 1}`}
                            style={{
                              width: '120px',
                              height: '70px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid #ddd',
                              flexShrink: 0
                            }}
                          />

                          {/* Banner info */}
                          <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
                            {isExisting ? (
                              <span style={{ color: '#666' }}>
                                Existing banner {index + 1}
                              </span>
                            ) : (
                              <span style={{ color: '#4A90D9' }}>
                                New image
                              </span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                            {/* Move up */}
                            <button
                              type="button"
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              title="Move up"
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: index === 0 ? '#f5f5f5' : '#fff',
                                cursor: index === 0 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                color: index === 0 ? '#ccc' : '#666'
                              }}
                            >
                              ▲
                            </button>

                            {/* Move down */}
                            <button
                              type="button"
                              onClick={() => handleMoveDown(index)}
                              disabled={index === bannerPreviews.length - 1}
                              title="Move down"
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: index === bannerPreviews.length - 1 ? '#f5f5f5' : '#fff',
                                cursor: index === bannerPreviews.length - 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                color: index === bannerPreviews.length - 1 ? '#ccc' : '#666'
                              }}
                            >
                              ▼
                            </button>

                            {/* Replace */}
                            <label
                              title="Replace banner"
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: '#4A90D9',
                                backgroundColor: '#fff',
                                display: 'inline-flex',
                                alignItems: 'center'
                              }}
                            >
                              🔄
                              <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                onChange={(e) => handleReplaceBanner(index, e)}
                                style={{ display: 'none' }}
                              />
                            </label>

                            {/* Remove */}
                            <button
                              type="button"
                              onClick={() => handleRemoveBanner(index)}
                              title="Remove banner"
                              style={{
                                padding: '4px 8px',
                                border: '1px solid #ff4444',
                                borderRadius: '4px',
                                backgroundColor: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                color: '#ff4444'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* No banners message */}
              {bannerPreviews.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '1rem',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  color: '#999'
                }}>
                  No banner images added yet
                </div>
              )}
            </div>

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