import { useEffect, useState } from 'react'

/**
 * Toast — auto-dismissing notification
 * Props:
 *   message  string   text to display
 *   type     'success' | 'danger'   defaults to 'success'
 *   duration number   ms before auto-dismiss (default 3000)
 *   onClose  fn       called when dismissed
 */
export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!message) return
    // trigger slide-in on next tick
    const show = requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // wait for slide-out animation
    }, duration)
    return () => {
      cancelAnimationFrame(show)
      clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  const icons = {
    success: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ),
    danger: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  }

  return (
    <div className={`toast toast-${type} ${visible ? 'toast-visible' : ''}`} role="alert" aria-live="polite">
      <span className="toast-icon">{icons[type] ?? icons.success}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => { setVisible(false); setTimeout(onClose, 300) }} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}
