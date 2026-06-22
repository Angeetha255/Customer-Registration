/**
 * Modal — closes on X click or backdrop click.
 * footer prop: renders custom footer content (e.g. action buttons).
 * If no footer prop, renders no footer at all.
 */
export default function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && (
          <div className="modal-footer">{footer}</div>
        )}
      </div>
    </div>
  )
}
