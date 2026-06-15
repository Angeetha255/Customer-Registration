import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { registerCustomer, fetchIntroducer } from '../services/api.js'
import Modal from '../components/Modal.jsx'
import Alert from '../components/Alert.jsx'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [introducer, setIntroducer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const ref = params.get('ref')
    if (ref) {
      fetchIntroducer(ref)
        .then((data) => setIntroducer(data))
        .catch(() => setIntroducer(null))
    }
  }, [location.search])

  const handleChange = (event) => {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const payload = { ...form }
      if (introducer && introducer.introducerId) payload.referredBy = introducer.introducerId
      const response = await registerCustomer(payload)
      setSuccess(`Registration completed! Your Introducer ID is ${response.introducerId}`)
      // open modal with created user and introducer details
      setCreatedUser(response.user || { name: form.name, email: form.email, phone: form.phone, introducerId: response.introducerId, customerId: response.customerId })
      setModalOpen(true)
      setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-shell">
      <section className="page-panel card">
        <h1>Create an account</h1>
        <p className="subtitle">Register with a secure account and receive your auto-generated Customer ID.</p>
        <Alert type={error ? 'danger' : 'success'} message={error || success} />
        <form onSubmit={handleSubmit} className="form-grid">
          {introducer && (
            <div className="card card-quiet">
              <strong>Introduced By:</strong>
              <div>
                <div>Name: {introducer.name}</div>
                <div>Introducer ID: {introducer.introducerId}</div>
                <div>Email: {introducer.email}</div>
                <div>Phone: {introducer.phone}</div>
              </div>
            </div>
          )}
          <label>
            Full Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email Address
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Phone Number
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} />
          </label>
          <label>
            Confirm Password
            <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} />
          </label>
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Sign up'}
          </button>
        </form>
        <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); navigate('/login') }} title="Registration Successful">
          <div>
            <p>✅ Registration Successful</p>
            <h4>Your Details</h4>
            {createdUser && (
              <div>
                <div><strong>Name:</strong> {createdUser.name}</div>
                <div><strong>Email:</strong> {createdUser.email}</div>
                <div><strong>Phone:</strong> {createdUser.phone}</div>
                <div><strong>Introducer ID:</strong> {createdUser.introducerId || 'N/A'}</div>
                <div><strong>Customer ID:</strong> {createdUser.customerId || 'N/A'}</div>
              </div>
            )}
            {introducer && (
              <>
                <h4>Introduced By</h4>
                <div><strong>Name:</strong> {introducer.name}</div>
                <div><strong>Introducer ID:</strong> {introducer.introducerId}</div>
                <div><strong>Email:</strong> {introducer.email}</div>
                <div><strong>Phone:</strong> {introducer.phone}</div>
              </>
            )}
          </div>
        </Modal>
        <p className="form-footer">
          Already have an account? <button type="button" className="button-link" onClick={() => navigate('/login')}>Login</button>
        </p>
      </section>
    </main>
  )
}
