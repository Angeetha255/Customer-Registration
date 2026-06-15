import React, { useState } from 'react'

export default function FloatingInput({ label, id, name, type = 'text', value, onChange, required, minLength, error, showToggle = false, inputProps = {} }) {
  const inputId = id || `field_${name}`
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && showToggle ? (visible ? 'text' : 'password') : type

  return (
    <div className="floating-field">
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
      <label htmlFor={inputId}>{label}</label>
      {showToggle && type === 'password' && (
        <button
          type="button"
          className="field-toggle"
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      )}
      {error && <div className="field-error">{error}</div>}
    </div>
  )
}
