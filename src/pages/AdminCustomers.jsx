import { useEffect, useState } from 'react'
import { deleteCustomer, exportCustomers, fetchAdminCustomers } from '../services/api.js'
import Alert from '../components/Alert.jsx'

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
    if (!window.confirm('Delete this customer?')) return
    try {
      await deleteCustomer(id)
      setMessage('Customer deleted successfully.')
      load(query)
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
      <section className="page-panel card">
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
          <table>
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
                <tr key={customer._id}>
                  <td>{customer.customerId}</td>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.introducerId || 'N/A'}</td>
                  <td>{new Date(customer.registeredAt).toLocaleDateString()}</td>
                  <td>
                    <button type="button" className="button button-small" onClick={() => handleDelete(customer._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <button className="button button-secondary" disabled={meta.page <= 1} onClick={() => handlePage(-1)}>Previous</button>
          <span>Page {meta.page} / {Math.ceil(meta.total / meta.limit) || 1}</span>
          <button className="button button-secondary" disabled={meta.page >= Math.ceil(meta.total / meta.limit)} onClick={() => handlePage(1)}>Next</button>
        </div>
      </section>
    </main>
  )
}
