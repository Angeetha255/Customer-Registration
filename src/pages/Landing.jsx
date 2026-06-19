import { useNavigate } from 'react-router-dom'
import heroIllo from '../assets/hero-illustration.svg'

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    title: 'Customer Management',
    desc: 'Register, track and manage all customers from a powerful admin panel.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    title: 'Referral System',
    desc: 'Unique referral links per user. Track referrals and grow your network.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
    title: 'Secure Access',
    desc: 'JWT-based authentication with separate portals for admins and customers.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    title: 'Analytics & Reports',
    desc: 'Real-time dashboards, growth stats, and CSV/PDF export for your data.',
  },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">

      {/* ── Top nav ── */}
      <header className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">CM</div>
            <span className="landing-logo-text">CustomerPro</span>
          </div>
          <div className="landing-nav-actions">
            <button className="button landing-nav-btn-ghost" onClick={() => navigate('/login')}>
              User Login
            </button>
            <button className="button landing-nav-btn-solid" onClick={() => navigate('/admin-login')}>
              Admin Login
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-blob landing-blob1" />
        <div className="landing-hero-blob landing-blob2" />
        <div className="landing-hero-blob landing-blob3" />

        <div className="landing-hero-inner">
          <div className="landing-hero-text">
            <span className="landing-pill">✦ Trusted User Management Platform</span>
            <h1 className="landing-hero-title">
              Manage Users,<br />
              <span className="landing-hero-accent">Track Referrals</span><br />
              &amp; Grow Faster
            </h1>
            <p className="landing-hero-desc">
              A complete platform for registering Users, managing referral networks,
              and tracking growth — all secured with role-based access control.
            </p>
            <div className="landing-hero-cta">
              <button className="button landing-cta-primary" onClick={() => navigate('/register')}>
                Create Account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft:6}}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
              {/* <button className="button landing-cta-secondary" onClick={() => navigate('/login')}>
             User Login
              </button> */}
            </div>
            <p className="landing-hero-admin-link">
              Are you an admin?{' '}
              <button className="button-link" onClick={() => navigate('/admin-login')}>
                Access Admin Panel 
              </button>
            </p>
          </div>

          {/* Hero illustration */}
          <div className="landing-hero-illo">
            <img src={heroIllo} alt="Dashboard illustration" className="landing-hero-img" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="landing-features-inner">
          <div className="landing-section-label">Features</div>
          <h2 className="landing-section-title">Everything you need to manage users</h2>
          <div className="landing-features-grid">
            {features.map((f) => (
              <div key={f.title} className="landing-feature-card">
                <div className="landing-feature-icon">{f.icon}</div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portal cards ── */}
      <section className="landing-portals">
        <div className="landing-portals-inner">
          <h2 className="landing-section-title">Choose your portal</h2>
          <div className="landing-portals-grid">
            {/* Customer portal */}
            <div className="landing-portal-card landing-portal-customer">
              <div className="landing-portal-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <h3>User Portal</h3>
              <p>View your profile, track referrals, and manage your account details.</p>
              <ul className="landing-portal-features">
                <li>✓ Personal dashboard</li>
                <li>✓ Referral link management</li>
                <li>✓ Profile editing</li>
              </ul>
              <div className="landing-portal-actions">
                <button className="button landing-portal-btn-primary" onClick={() => navigate('/login')}>
                  User Login
                </button>
                {/* <button className="button landing-portal-btn-ghost" onClick={() => navigate('/register')}>
                  Register
                </button> */}
              </div>
            </div>

            {/* Admin portal */}
            <div className="landing-portal-card landing-portal-admin">
              <div className="landing-portal-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Admin Portal</h3>
              <p>Full control over User data, registrations, and platform analytics.</p>
              <ul className="landing-portal-features">
                <li>✓ User management</li>
                <li>✓ Analytics & reporting</li>
                <li>✓ Export CSV / PDF</li>
              </ul>
              <div className="landing-portal-actions">
                <button className="button landing-portal-btn-admin" onClick={() => navigate('/admin-login')}>
                  Admin Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-logo">
            <div className="landing-logo-mark">CM</div>
            <span className="landing-logo-text" style={{color:'#94a3b8'}}>UserPro</span>
          </div>
          <p className="landing-footer-copy">© {new Date().getFullYear()} UserPro. All rights reserved.</p>
        </div>
      </footer>

    </div>
  )
}
