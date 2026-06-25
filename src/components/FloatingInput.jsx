import React, { useState } from 'react'

export default function FloatingInput({ label, id, name, type = 'text', value, onChange, required, minLength, error, showToggle = false, inputProps = {}, multiline = false, rows = 3, options = [], disabled = false }) {
  const inputId = id || `field_${name}`
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && showToggle ? (visible ? 'text' : 'password') : type

  return (
    <div className="floating-field">
      {multiline ? (
        <textarea
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder=" "
          required={required}
          rows={rows}
          className={`${error ? 'invalid' : ''}`.trim()}
          aria-invalid={!!error}
        />
      ) : type === 'select' ? (
        <select
          id={inputId}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`${error ? 'invalid' : ''}`.trim()}
          aria-invalid={!!error}
        >
          {options.length > 0 && (
            <option value="" disabled>{label}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          {...inputProps}
          placeholder=" "
          required={required}
          minLength={minLength}
          className={`${error ? 'invalid' : ''} ${showToggle && type === 'password' ? 'with-toggle' : ''}`.trim()}
          aria-invalid={!!error}
        />
      )}
      <label htmlFor={inputId}>{label}</label>
      {showToggle && type === 'password' && !multiline && type !== 'select' && (
        <button
          type="button"
          className="field-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      )}
      {error && <div className="field-error">{error}</div>}
    </div>
  )
}