import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-panel">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
