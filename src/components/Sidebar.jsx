import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ open, onToggle }) {
  const { adminUser, customerUser } = useAuth()
  const location = useLocation()
  
  // Use the correct user based on current route to support simultaneous admin+customer sessions
  const isAdminRoute = location.pathname.startsWith('/admin')
  const user = isAdminRoute ? adminUser : customerUser
  const [genealogyOpen, setGenealogyOpen] = useState(true)
  const [companyOpen, setCompanyOpen] = useState(true)

  const adminItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin/customers' },
  ]

  const customerItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' },
  ]

  const genealogyItems = [
    { label: 'My Direct', path: '/genealogy/my-direct' },
    { label: 'My Team', path: '/genealogy/my-team' },
    { label: 'Team View', path: '/genealogy/team-view' },
  ]

  const companyItems = [
    { label: 'Settings', path: '/admin/settings' },
  ]

  const navItems = user?.type === 'admin' ? adminItems : customerItems

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

        {user?.type !== 'admin' && (
          <div className="nav-section">
            <button
              type="button"
              className="nav-section-toggle"
              onClick={() => setGenealogyOpen((v) => !v)}
              aria-expanded={genealogyOpen}
            >
              <span>Genealogy</span>
              <span className={`nav-chevron ${genealogyOpen ? 'open' : ''}`}>▾</span>
            </button>
            {genealogyOpen && (
              <div className="nav-sub">
                {genealogyItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {user?.type === 'admin' && (
          <div className="nav-section">
            <button
              type="button"
              className="nav-section-toggle"
              onClick={() => setCompanyOpen((v) => !v)}
              aria-expanded={companyOpen}
            >
              <span>Company</span>
              <span className={`nav-chevron ${companyOpen ? 'open' : ''}`}>▾</span>
            </button>
            {companyOpen && (
              <div className="nav-sub">
                {companyItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={handleNavClick}
                    className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="sidebar-bottom-space" />
    </aside>
  )
}
