import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { customerUser, loading } = useAuth()
  if (loading) return <div className="page-panel">Loading...</div>
  if (!customerUser || customerUser.type !== 'customer') return <Navigate to="/login" replace />
  return children
}
