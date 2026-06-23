import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { registerCustomer, fetchReferrer, fetchTopId, checkReferral } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Modal from '../components/Modal.jsx'
import Alert from '../components/Alert.jsx'
import FloatingInput from '../components/FloatingInput.jsx'
import illustration from '../assets/register-illustration.svg'

export default function Register() {
  const { signIn } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', referralUserId: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [referrer, setReferrer] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [createdUser, setCreatedUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [autoLoggingIn, setAutoLoggingIn] = useState(false)
  const [topIdExists, setTopIdExists] = useState(false)
  const [validReferral, setValidReferral] = useState(false)
  const [referralMode, setReferralMode] = useState('link')
  const [validatingUserId, setValidatingUserId] = useState(false)
  const [userIdError, setUserIdError] = useState('')
  // Saved before form is cleared — used for auto-login after registration
  const [savedCredentials, setSavedCredentials] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
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
        if (ref) {
          try {
            const referralData = await checkReferral(ref)
            if (referralData?.valid) {
              setReferrer(referralData.referrer)
              setValidReferral(true)
              setReferralMode('link')
              setForm(prev => ({ ...prev, referralUserId: referralData.referrer.userId || `MEM${referralData.referrer.id}` }))
            } else {
              setValidReferral(false)
              setReferrer(null)
              setReferralMode('userid')
              setForm(prev => ({ ...prev, referralUserId: '' }))
            }
          } catch (e) {
            setValidReferral(false)
            setReferrer(null)
            setReferralMode('userid')
            setForm(prev => ({ ...prev, referralUserId: '' }))
          }
        } else {
          setValidReferral(false)
          setReferrer(null)
          setReferralMode('userid')
          setForm(prev => ({ ...prev, referralUserId: '' }))
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
    } else if (name === 'referralUserId') {
      setForm({ ...form, referralUserId: value })
      setUserIdError('')
      // Reset validation state when the field is edited (only in userid mode)
      if (referralMode === 'userid') {
        setValidReferral(false)
        setReferrer(null)
      }
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const validateReferralUserId = async () => {
    const userIdValue = form.referralUserId.trim()
    if (!userIdValue) {
      setUserIdError('Referral User ID is required.')
      return
    }
    setValidatingUserId(true)
    setUserIdError('')
    try {
      const user = await fetchReferrer(userIdValue)
      if (user) {
        setReferrer(user)
        setValidReferral(true)
      } else {
        setUserIdError('Invalid User ID. Please enter a valid User ID.')
        setValidReferral(false)
        setReferrer(null)
      }
    } catch (err) {
      setUserIdError('Invalid User ID. Please enter a valid User ID.')
      setValidReferral(false)
      setReferrer(null)
    } finally {
      setValidatingUserId(false)
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
      if (!/^[0-9]{10}$/.test(form.phone)) {
        setError('Phone number must be 10 digits.')
        setLoading(false)
        return
      }
      const payload = { ...form }
      delete payload.referralUserId
      if (validReferral && referrer?.id) {
        payload.referredBy = referrer.id
      } else {
        delete payload.referredBy
      }
      const response = await registerCustomer(payload)
      setSuccess('Registration completed!')
      setCreatedUser(response.user || { name: form.name, email: form.email, phone: form.phone })
      // Save credentials before clearing form so auto-login can use them
      setSavedCredentials({ email: form.email, password: form.password })
      setShowPassword(false)
      setModalOpen(true)
      setForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', referralUserId: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoToDashboard = async () => {
    if (!savedCredentials) { navigate('/login'); return }
    setAutoLoggingIn(true)
    try {
      // signIn clears old session, logs in fresh as the new user
      await signIn(savedCredentials)
      setModalOpen(false)
      // Small delay lets React flush the new user state before navigating
      setTimeout(() => navigate('/dashboard'), 50)
    } catch (err) {
      setModalOpen(false)
      setError(err.message || 'Auto-login failed. Please log in manually.')
      navigate('/login')
    } finally {
      setAutoLoggingIn(false)
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
            <p className="subtitle">Register and receive your auto-generated User ID.</p>

            <Alert type={error ? 'danger' : 'success'} message={error || success} />

            {!topIdExists ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <h3>Registration Unavailable</h3>
                <p>Please contact support to get started.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="form-grid register-form">
                {referralMode === 'link' && referrer ? (
                  <>
                    <div className="introducer-badge">
                      <span className="feature-icon">✦</span>
                      <div>
                        <strong>Referred by {referrer.name}</strong>
                        <span>User ID: {referrer.userId || `MEM${referrer.id}`}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>Referrer User ID</label>
                      <input
                        type="text"
                        name="referralUserId"
                        value={form.referralUserId}
                        readOnly
                        className="form-input"
                        style={{ backgroundColor: 'var(--input-bg-readonly, #f5f5f5)' }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="form-group">
                    <label style={{ fontSize: '0.9rem', fontWeight: 500, marginBottom: 4, display: 'block' }}>Referrer User ID *</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        name="referralUserId"
                        value={form.referralUserId}
                        onChange={handleChange}
                        required
                      placeholder="Enter Referral User ID *"
                        className="form-input"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={validateReferralUserId}
                        disabled={validatingUserId || !form.referralUserId.trim()}
                      >
                        {validatingUserId ? 'Validating...' : 'Validate'}
                      </button>
                    </div>
                    {userIdError && <p style={{ color: 'red', fontSize: '0.85rem', marginTop: 4 }}>{userIdError}</p>}
                    {referrer && referralMode === 'userid' && (
                      <div className="introducer-badge" style={{ marginTop: 8 }}>
                        <span className="feature-icon">✓</span>
                        <div>
                          <strong>Referred by {referrer.name}</strong>
                          <span>User ID: {referrer.userId || `MEM${referrer.id}`}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <FloatingInput label="Full Name *"        name="name"            value={form.name}            onChange={handleChange} required />
                <FloatingInput label="Email Address *"    name="email"           type="email" value={form.email}    onChange={handleChange} required />
                <FloatingInput label="Phone Number *"     name="phone"           type="tel"   value={form.phone}    onChange={handleChange} required inputProps={{ inputMode: 'numeric', maxLength: 10 }} />
                <FloatingInput label="Password *"         name="password"        type="password" value={form.password}    onChange={handleChange} required minLength={6} showToggle />
                <FloatingInput label="Confirm Password *" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required minLength={6} showToggle />

                <button type="submit" className="button button-primary register-submit"
                  disabled={loading || (referralMode === 'userid' && !validReferral)}>
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
        footer={
          <button
            type="button"
            className="button button-primary"
            onClick={handleGoToDashboard}
            disabled={autoLoggingIn}
          >
            {autoLoggingIn ? 'Logging in…' : 'Go to Dashboard'}
          </button>
        }
      >
        <div>
          <p>✅ Registration Successful</p>
          <h4>Your Details</h4>
          {createdUser && (
            <div>
              <div><strong>User ID:</strong> {createdUser.userId || `MEM${createdUser.id}`}</div>
              <div><strong>Email:</strong> {createdUser.email}</div>
              <div>
                <strong>Password:</strong>{' '}
                {showPassword ? savedCredentials?.password : '••••••'}
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-strong)',
                    cursor: 'pointer',
                    marginLeft: 8,
                    fontSize: '0.85rem',
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}
          {referrer && (
            <>
              <h4>Referred By</h4>
              <div><strong>Name:</strong> {referrer.name}</div>
              <div><strong>User ID:</strong> {referrer.userId || `MEM${referrer.id}`}</div>
            </>
          )}
        </div>
      </Modal>
    </main>
  )
}