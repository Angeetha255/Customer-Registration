import { useEffect, useState } from 'react'
import { deleteCustomer, exportCustomers, fetchAdminCustomers, updateCustomer } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import BackButton from '../components/BackButton.jsx'

const initialQuery = { page: 1, limit: 10, sort: 'registeredAt' }

export default function AdminCustomers() {
  const [query, setQuery] = useState(initialQuery)
  const [customers, setCustomers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10 })
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const run = async () => {
      await load(query)
    }
    run()
  }, [query])

  const handleSearch = (event) => {
    event.preventDefault()
    setQuery({ ...query, search, page: 1 })
  }

  const handleDelete = async (id) => {
    // use modal confirmation flow handled below
    // kept for backward compatibility
    if (!window.confirm('Delete this customer?')) return
    try {
      await deleteCustomer(id)
      setMessage('Customer deleted successfully.')
      load(query)
    } catch (err) {
      setError(err.message)
    }
  }

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', introducerId: '', active: true })

  const openEdit = (customer) => {
    setEditingCustomer(customer)
    setEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      introducerId: customer.introducerId || '',
      active: typeof customer.active === 'undefined' ? true : !!customer.active,
    })
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingCustomer(null)
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const saveEdit = async () => {
    setError('')
    setMessage('')
    try {
      // basic validation
      if (!editForm.name || !editForm.email || !editForm.phone) {
        setError('Name, email and phone are required.')
        return
      }
      await updateCustomer(editingCustomer.id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        introducerId: editForm.introducerId,
        active: editForm.active,
      })
      setMessage('Customer updated successfully.')
      closeEdit()
      await load(query)
    } catch (err) {
      setError(err.message)
    }
  }

  // Delete modal state
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const openDelete = (customer) => {
    setDeleteTarget(customer)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setDeleteTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteCustomer(deleteTarget.id)
      setMessage('Customer deleted successfully.')
      closeDelete()
      await load(query)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleExport = (format) => {
    exportCustomers(format).then(async (response) => {
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `customers.${format}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    }).catch((err) => setError(err.message))
  }

  const handlePage = (direction) => {
    setQuery((current) => ({
      ...current,
      page: Math.max(1, current.page + direction),
    }))
  }

  return (
    <main className="page-shell layout-with-sidebar">
      <section className="page-panel card no-border-panel">
        <BackButton />
        <h1>Customer Management</h1>
        <p className="subtitle">Search, sort, edit and export customer records.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || message} />

        <form className="search-row" onSubmit={handleSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by customer ID, introducer ID, name, email, phone" />
          <button className="button button-secondary" type="submit">Search</button>
          <button type="button" className="button button-muted" onClick={() => handleExport('csv')}>Export CSV</button>
          <button type="button" className="button button-muted" onClick={() => handleExport('pdf')}>Export PDF</button>
        </form>

        <div className="table-scroll">
          <table className="customers-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Introducer ID</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Loading customers…</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan="7">No matching customers found.</td></tr>
              ) : customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.customerId || customer.customerId}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                    <td>{customer.introducerId || 'N/A'}</td>
                    <td>{(function(d){ if(!d) return '—'; const dt=new Date(d); return String(dt.getDate()).padStart(2,'0')+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+dt.getFullYear() })(customer.registeredAt)}</td>
                    <td>
                      <button title="Edit" type="button" className="icon-button" onClick={() => openEdit(customer)} style={{marginRight:8}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 21h4l11-11a2 2 0 0 0-4-4L4 17v4z" fill="#111827"/></svg>
                      </button>
                      <button title="Delete" type="button" className="icon-button" onClick={() => openDelete(customer)}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 3h6l1 2h5v2H3V5h5l1-2zM6 9h12v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" fill="#ef4444"/></svg>
                      </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Edit Modal */}
        {editOpen && (
          <div className="modal-backdrop">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Edit Customer</h3>
                <button className="modal-close" onClick={closeEdit}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <label>Full Name<input name="name" value={editForm.name} onChange={handleEditChange} /></label>
                  <label>Email Address<input name="email" value={editForm.email} onChange={handleEditChange} /></label>
                  <label>Phone Number<input name="phone" value={editForm.phone} onChange={handleEditChange} /></label>
                  <label>Introducer ID<input name="introducerId" value={editForm.introducerId} onChange={handleEditChange} /></label>
                  <label>Status<select name="active" value={editForm.active ? 'active' : 'inactive'} onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.value === 'active' }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select></label>
                  <label>Date of Joining<input value={(editingCustomer?.registeredAt) ? (new Date(editingCustomer.registeredAt)).toLocaleDateString() : ''} disabled /></label>
                  <label>Customer ID<input value={editingCustomer?.customerId || ''} disabled /></label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="button button-muted" onClick={closeEdit}>Cancel</button>
                <button className="button button-primary" onClick={saveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteOpen && (
          <div className="modal-backdrop">
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
