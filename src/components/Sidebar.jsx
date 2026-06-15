import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const navItems = user?.role === 'admin' ? [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Customers', path: '/admin/customers' },
  ] : [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' },
  ]

  return (
    <aside className="sidebar">
      <div className="brand">Customer Management</div>
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        {user && <span>{user.role === 'admin' ? 'Admin' : 'Customer'} signed in</span>}
        <button type="button" className="button button-muted" onClick={signOut}>Logout</button>
      </div>
    </aside>
  )
}
