import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Sidebar({ open, onToggle }) {
  const { adminUser, customerUser } = useAuth()
  const location = useLocation()
  
  // Use the correct user based on current route to support simultaneous admin+customer sessions
  const isAdminRoute = location.pathname.startsWith('/admin')
  const user = isAdminRoute ? adminUser : customerUser
  const [openSections, setOpenSections] = useState({ Company: true, Genealogy: true, Masters: true })

  const companyItems = [
    { label: 'Set prefix', path: '/admin/settings' },
  ]

  const mastersItems = [
    { label: 'Countries', path: '/admin/masters/countries' },
    { label: 'States', path: '/admin/masters/states' },
    { label: 'Districts', path: '/admin/masters/districts' },
    { label: 'Areas', path: '/admin/masters/areas' },
    { label: 'Categories', path: '/admin/masters/categories' },
    { label: 'SubCategories', path: '/admin/masters/subcategories' },
  ]

  const adminItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Users', path: '/admin/customers' },
    { label: 'Masters', isSection: true, items: mastersItems },
    { label: 'Company', isSection: true, items: companyItems },
  ]

  const genealogyItems = [
    { label: 'My Direct', path: '/genealogy/my-direct' },
    { label: 'My Team', path: '/genealogy/my-team' },
    { label: 'Team View', path: '/genealogy/team-view' },
  ]

  const customerItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Profile', path: '/profile' },
    { label: 'Business Directory', path: '/business-directory' },
    { label: 'Genealogy', isSection: true, items: genealogyItems },
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
        {navItems.map((item) => {
          if (item.isSection) {
            const isOpen = openSections[item.label] || false
            return (
              <div className="nav-section" key={item.label}>
                <button
                  type="button"
                  className="nav-section-toggle"
                  onClick={() => setOpenSections((v) => ({ ...v, [item.label]: !(v[item.label] || false) }))}
                  aria-expanded={isOpen}
                >
                  <span>{item.label}</span>
                  <span className={`nav-chevron ${isOpen ? 'open' : ''}`}>▾</span>
                </button>
                {isOpen && (
                  <div className="nav-sub">
                    {item.items.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        onClick={handleNavClick}
                        className={({ isActive }) => isActive ? 'nav-link nav-sublink active' : 'nav-link nav-sublink'}
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end
              onClick={handleNavClick}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            >
              {item.label}
            </NavLink>
          )
        })}

      </nav>

      <div className="sidebar-bottom-space" />
    </aside>
  )
}
