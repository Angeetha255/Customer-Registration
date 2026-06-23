import { useState, useEffect } from 'react'
import { fetchSettings, updateSetting } from '../services/api.js'
import Alert from '../components/Alert.jsx'
import Toast from '../components/Toast.jsx'

export default function Settings() {
  const [userIdPrefix, setUserIdPrefix] = useState('MEM')
  const [userIdPrefixInput, setUserIdPrefixInput] = useState('MEM')
  const [savingPrefix, setSavingPrefix] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const showToast = (msg, type = 'success') => setToast({ message: msg, type })

  useEffect(() => {
    fetchSettings()
      .then((s) => {
        const u = s.userIdPrefix || 'MEM'
        setUserIdPrefix(u)
        setUserIdPrefixInput(u)
      })
      .catch(() => {})
  }, [])

  const savePrefix = async () => {
    if (!userIdPrefixInput.trim()) return
    setSavingPrefix(true)
    setError('')
    try {
      await updateSetting('userIdPrefix', userIdPrefixInput.trim().toUpperCase())
      setUserIdPrefix(userIdPrefixInput.trim().toUpperCase())
      showToast('Settings saved successfully.')
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'danger')
    } finally {
      setSavingPrefix(false)
    }
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
            <h1>Settings</h1>
            <br />
          </div>
        </div>
        <br />

        <Alert type="danger" message={error} />

        <div className="ad-table-card">
          <div className="table-header">
            <h3>User ID Prefix Configuration</h3>
          </div>
          <div style={{ padding: '20px', maxWidth: 500 }}>
            <div className="form-grid">
              <label>
                User ID Prefix
                <input
                  value={userIdPrefixInput}
                  onChange={(e) => setUserIdPrefixInput(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  maxLength={10}
                  placeholder="e.g. MEM"
                  style={{ textTransform: 'uppercase' }}
                />
                <small style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                  New users get IDs like {userIdPrefixInput.trim().toUpperCase() || 'MEM'}12345. Does not change existing user IDs.
                </small>
              </label>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="button button-primary"
                onClick={savePrefix}
                disabled={savingPrefix}
              >
                {savingPrefix ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}