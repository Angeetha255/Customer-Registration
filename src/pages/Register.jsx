import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { registerCustomer, fetchReferrer, fetchTopId, checkReferral } from '../services/api.js'
import Modal from '../components/Modal.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import illustration from '../assets/register-illustration.svg'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [referrer, setReferrer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [topIdExists, setTopIdExists] = useState(false)
  const [validReferral, setValidReferral] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check Top ID and referral
  useEffect(() => {
    const init = async () => {
      try {
        const topData = await fetchTopId()
        setTopIdExists(!!topData?.topUserId)
        
        const params = new URLSearchParams(location.search)
        const ref = params.get('ref')
        if (ref && /^\d+$/.test(ref)) {
          try {
            const referralData = await checkReferral(ref)
            if (referralData?.valid) {
              setReferrer(referralData.referrer)
              setValidReferral(true)
            } else {
              setValidReferral(false)
              setReferrer(null)
            }
          } catch (e) {
            setValidReferral(false)
            setReferrer(null)
          }
        } else {
          setValidReferral(false)
          setReferrer(null)
        }
      } catch (e) {
        console.error('Init failed:', e)
        setTopIdExists(false)
      }
    }
    init()
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
      if (!topIdExists) {
        setError('Registration is currently unavailable. Please contact support.')
        return
      }
      if (!validReferral || !referrer?.id) {
        setError('Registration requires a valid referral link.')
        return
      }
      if (!/^[0-9]{10}$/.test(form.phone)) {
        setError('Phone number must be 10 digits.')
        setLoading(false)
        return
      }
      const payload = { ...form }
      // Pass the referrer's numeric id so the backend can store it as referredBy
      payload.referredBy = referrer.id
      const response = await registerCustomer(payload)
      setSuccess(`Registration completed! Your Referral ID is ${response.referralId}`)
      setCreatedUser(response.user || { name: form.name, email: form.email, phone: form.phone })
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
              <p className="register-brand-welcome-sub">
                Join our platform and manage your customers, referrals, and growth all in one place.
              </p>
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
            <p className="subtitle">Register and receive your auto-generated Referral ID.</p>

            <Alert type={error ? 'danger' : 'success'} message={error || success} />

            {!topIdExists ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h3>Registration Unavailable</h3>
                <p>Please contact support to get started.</p>
              </div>
            ) : !validReferral ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h3>Valid Referral Required</h3>
                <p>You must have a valid referral link to register. Please ask a current member to invite you.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-grid register-form">
                {referrer && (
                  <div className="introducer-badge">
                    <span className="feature-icon">✦</span>
                    <div>
                      <strong>Referred by {referrer.name}</strong>
                      <span>ID: {referrer.referralId || `REF${referrer.id}`}</span>
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
            )}

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
            </div>
          )}
          {referrer && (
            <>
              <h4>Referred By</h4>
              <div><strong>Name:</strong> {referrer.name}</div>
              <div><strong>Referral ID:</strong> {referrer.referralId}</div>
            </>
          )}
        </div>
      </Modal>
    </main>
  )
}
