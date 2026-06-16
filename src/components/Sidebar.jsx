import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ open, onToggle }) {
  const { user } = useAuth()
  const navItems = user?.role === 'admin' ? [
    { label: 'Dashboard',  path: '/admin' },
    { label: 'Customers',  path: '/admin/customers' },
  ] : [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile',   path: '/profile' },
  ]

  // Close sidebar on mobile when a nav link is clicked
  const handleNavClick = () => {
    if (window.innerWidth <= 900) {
      onToggle && onToggle()
    }
  }

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label="Close sidebar"
        aria-expanded={open}
      >
        <span className="bar" />
        <span className="bar" />
        <span className="bar" />
      </button>

      <div className="brand">
        <div className="logo">CM</div>
        <span className="brand-text">Customer Management</span>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={handleNavClick}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom-space" />
    </aside>
  )
}
