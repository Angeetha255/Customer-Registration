import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = 'Back' }) {
  const navigate = useNavigate()
  return (
    <button type="button" className="button button-link" onClick={() => navigate(-1)} style={{ marginBottom: 8 }}>
      ← {label}
    </button>
  )
}
