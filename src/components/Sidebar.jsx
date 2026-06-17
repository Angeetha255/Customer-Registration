import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ open, onToggle }) {
  const { user } = useAuth()
  const navItems = user?.role === 'admin' ? [
    { label: 'Dashboard',  path: '/admin' },
    { label: 'Users',  path: '/admin/customers' },
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
      <div className="sidebar-header">
        <span className="sidebar-logo">CM</span>
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
