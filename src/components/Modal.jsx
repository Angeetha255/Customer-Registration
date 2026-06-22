import React from 'react'

export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          {footer || <button type="button" className="button" onClick={onClose}>Close</button>}
        </div>
      </div>
    </div>
  )
}
