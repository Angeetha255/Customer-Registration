import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function AdminRoute({ children }) {
  const { adminUser, loading } = useAuth()
  if (loading) return <div className="page-panel">Loading...</div>
  if (!adminUser || adminUser.type !== 'admin') return <Navigate to="/admin/login" replace />
  return children
}
