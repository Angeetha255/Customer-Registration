import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { registerCustomer, fetchIntroducer } from '../services/api.js'
import Modal from '../components/Modal.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import illustration from '../assets/register-illustration.svg'

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
    const { name, value } = event.target
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10)
      setForm({ ...form, phone: digits })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      if (!/^[0-9]{10}$/.test(form.phone)) {
        setError('Phone number must be 10 digits.')
        setLoading(false)
        return
      }
      const payload = { ...form }
      if (introducer && introducer.introducerId) payload.referredBy = introducer.introducerId
      const response = await registerCustomer(payload)
      setSuccess(`Registration completed! Your Introducer ID is ${response.introducerId}`)
      setCreatedUser(response.user || {
        name: form.name, email: form.email, phone: form.phone,
        introducerId: response.introducerId, customerId: response.customerId,
      })
      setModalOpen(true)
      setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="register-page">
      <div className="register-split">

        {/* ── Left: branding panel ── */}
        <div className="register-brand">
          <div className="register-brand-inner">
            <div className="register-brand-welcome">
              <p className="register-brand-welcome-title">Welcome!</p>
              <p className="register-brand-welcome-sub">Join our platform and manage your customers, referrals, and growth all in one place.</p>
            </div>
           

            <div className="register-brand-illustration">
              <img src={illustration} alt="Platform illustration" />
            </div>
          </div>
        </div>

        {/* ── Right: form panel ── */}
        <div className="register-form-panel">
          <div className="register-form-inner">
            <h1>Create an account</h1>
            <p className="subtitle">Register and receive your auto-generated Customer ID.</p>

            <Alert type={error ? 'danger' : 'success'} message={error || success} />

            <form onSubmit={handleSubmit} className="form-grid register-form">
              {introducer && (
                <div className="introducer-badge">
                  <span className="feature-icon">✦</span>
                  <div>
                    <strong>Introduced by {introducer.name}</strong>
                    <span>ID: {introducer.introducerId}</span>
                  </div>
                </div>
              )}
              <FloatingInput label="Full Name"        name="name"            value={form.name}            onChange={handleChange} required />
              <FloatingInput label="Email Address"    name="email"           type="email" value={form.email}    onChange={handleChange} required />
              <FloatingInput label="Phone Number"     name="phone"           type="tel"   value={form.phone}    onChange={handleChange} required inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
              <FloatingInput label="Password"         name="password"        type="password" value={form.password}    onChange={handleChange} required minLength={6} showToggle />
              <FloatingInput label="Confirm Password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} showToggle />

              <button type="submit" className="button button-primary register-submit" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>

            <p className="form-footer">
              Already have an account?{' '}
              <button type="button" className="button-link" onClick={() => navigate('/login')}>
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); navigate('/login') }}
        title="Registration Successful"
      >
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
             
            </>
          )}
        </div>
      </Modal>
    </main>
  )
}
