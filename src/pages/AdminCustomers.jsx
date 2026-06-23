import { useEffect, useState, useCallback } from 'react'
import {
  deleteCustomer,
  exportCustomers,
  fetchAdminCustomers,
  updateCustomer,
} from '../services/api.js'
import Alert from '../components/Alert.jsx'
import Toast from '../components/Toast.jsx'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const initialQuery = { page: 1, limit: 10, sort: 'id' }

export default function AdminCustomers() {
  const [query, setQuery] = useState(initialQuery)
  const [customers, setCustomers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [toast, setToast] = useState({ message: '', type: 'success' })
  const showToast = useCallback((msg, type = 'success') => setToast({ message: msg, type }), [])

  const load = async (params) => {
    setError('')
    setLoading(true)
    try {
      const data = await fetchAdminCustomers(params)
      setCustomers(data.customers)
      setMeta({ total: data.total, page: data.page, limit: data.limit })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(query) }, [query])

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery({ ...query, search, page: 1 })
  }

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', active: true })

  const openEdit = (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      active: typeof customer.active === 'undefined' ? true : !!customer.active,
    })
    setEditOpen(true)
  }

  const closeEdit = () => { setEditOpen(false); setEditingCustomer(null) }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setEditForm((f) => ({ ...f, phone: digits }))
    } else {
      setEditForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    }
  }

  const saveEdit = async () => {
    setError('')
    try {
      if (!editForm.name || !editForm.email || !editForm.phone) {
        setError('Name, email and phone are required.')
        return
      }
      if (!/^[0-9]{10}$/.test(editForm.phone)) {
        setError('Phone number must be 10 digits.')
        return
      }
      await updateCustomer(editingCustomer.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        active: editForm.active,
      })
      closeEdit()
      await load(query)
      showToast('Customer updated successfully.')
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openDelete = (customer) => { setDeleteTarget(customer); setDeleteOpen(true) }
  const closeDelete = () => { setDeleteOpen(false); setDeleteTarget(null) }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      closeDelete()
      await load(query)
      showToast('Customer deleted successfully.')
    } catch (err) {
      showToast(err.message, 'danger')
    }
  }

  const handleExport = (format) => {
    exportCustomers(format)
      .then(async (response) => {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `customers.${format}`
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
      })
      .catch((err) => setError(err.message))
  }

  const handlePage = (direction) => {
    setQuery((current) => ({ ...current, page: Math.max(1, current.page + direction) }))
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <section className="page-panel card no-border-panel">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1>User Management</h1>
            <br></br>
            {/* <p className="subtitle">Search, sort, edit and export customer records.</p> */}
          </div>
        </div>
        <br></br>

        <Alert type="danger" message={error} />
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <form className="search-row" onSubmit={handleSearch} style={{ marginBottom: 0, maxWidth: 600, flex: 1 }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone"
              />
              <button className="button button-secondary" type="submit">Search</button>
            </form>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <button type="button" className="button button-muted" onClick={() => handleExport('csv')}>Export CSV</button>
              <button type="button" className="button button-muted" onClick={() => handleExport('pdf')}>Export PDF</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

              <select
                value={query.limit}
                onChange={(e) => setQuery((q) => ({ ...q, limit: Number(e.target.value), page: 1 }))}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', minHeight: 36 }}
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

            </div>
          </div>
        </div>

        <div className="table-scroll">
          <table className="customers-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>

                <th>Referred By</th>
                <th>Referrer User ID</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10">Loading customers…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="10">No matching customers found.</td></tr>
              ) : customers.map((customer) => (
                <tr key={customer.id}>
                  <td><span className="ad-cid-badge">{customer.id}</span></td>
                  <td><span className="ad-cid-badge">{customer.userId || '—'}</span></td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>

                  <td>{customer.referrerName || '—'}</td>
                  <td>{customer.referrerUserId || '—'}</td>
                  <td>
                    {(function (d) {
                      if (!d) return '—'
                      const dt = new Date(d)
                      return `${String(dt.getDate()).padStart(2, '0')}-${String(dt.getMonth() + 1).padStart(2, '0')}-${dt.getFullYear()}`
                    })(customer.regat)}
                  </td>
                  <td>
                    <button title="Edit" type="button" className="icon-button" onClick={() => openEdit(customer)} style={{ marginRight: 8 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 21h4l11-11a2 2 0 0 0-4-4L4 17v4z" fill="#111827" />
                      </svg>
                    </button>
                    <button title="Delete" type="button" className="icon-button" onClick={() => openDelete(customer)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 3h6l1 2h5v2H3V5h5l1-2zM6 9h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" fill="#ef4444" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Edit Customer Modal ── */}
        {editOpen && (
          <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeEdit() }}>
            <div className="modal-card">
              <div className="modal-header">
                <h3>Edit User</h3>
                <button className="modal-close" onClick={closeEdit}>✕</button>
              </div>
              <div className="modal-body">
                {error && <Alert type="danger" message={error} />}
                <div className="form-grid">
                  <label>
                    Full Name
                    <input name="name" value={editForm.name} onChange={handleEditChange} />
                  </label>
                  <label>
                    Email Address
                    <input name="email" value={editForm.email} onChange={handleEditChange} />
                  </label>
                  <label>
                    Phone Number
                    <input name="phone" value={editForm.phone} onChange={handleEditChange} />
                  </label>
                  <label>
                    ID
                    <input value={editingCustomer?.id || ''} disabled />
                  </label>
                  <label>
                    User ID
                    <input value={editingCustomer?.userId || '—'} disabled />
                  </label>
                  <label>
                    Status
                    <select
                      name="active"
                      value={editForm.active ? 'active' : 'inactive'}
                      onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.value === 'active' }))}
                    >
                      <option value="active">Yes</option>
                      <option value="inactive">No</option>
                    </select>
                  </label>
                  <label>
                    Date of Joining
                    <input
                      value={
                        editingCustomer?.regat
                          ? new Date(editingCustomer.regat)
                            .toLocaleDateString('en-GB')
                            .replace(/\//g, '-')
                          : ''
                      }
                      disabled
                    />
                  </label>
                  <label>
                    Referred By
                    <input value={editingCustomer?.referrerName || '—'} disabled />
                  </label>
                  <label>
                    Referrer User ID
                    <input value={editingCustomer?.referrerUserId || '—'} disabled />
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="button button-muted" onClick={closeEdit}>Cancel</button>
                <button className="button button-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Delete Confirm Modal ── */}
        {deleteOpen && (
          <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) closeDelete() }}>
            <div className="modal-card">
              <div className="modal-header">
                <h3>Delete Customer</h3>
                <button className="modal-close" onClick={closeDelete}>✕</button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</p>
              </div>
              <div className="modal-footer">
                <button className="button button-muted" onClick={closeDelete}>Cancel</button>
                <button className="button button-primary" onClick={confirmDelete}>Delete</button>
              </div>
            </div>
          </div>
        )}

        <div className="pagination-row">
          <button className="button button-secondary" disabled={meta.page <= 1} onClick={() => handlePage(-1)}>Previous</button>
          <span>Page {meta.page} / {Math.ceil(meta.total / meta.limit) || 1}</span>
          <button className="button button-secondary" disabled={meta.page >= Math.ceil(meta.total / meta.limit)} onClick={() => handlePage(1)}>Next</button>
        </div>
      </section>
    </main>
  )
}
