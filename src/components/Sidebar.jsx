import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ onToggle }) {
  const { user } = useAuth()
  const navItems = user?.role === 'admin' ? [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Customers', path: '/admin/customers' },
  ] : [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' },
  ]

  return (
    <aside className="sidebar">
      <button className="mobile-hamburger" onClick={() => onToggle && onToggle()} aria-label="Close sidebar">✕</button>
      <div className="brand">
        <div className="logo">CM</div>
        <div className="brand-text">Customer Management</div>
      </div>
      <nav>
        {navItems.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom-space" />
    </aside>
  )
}
