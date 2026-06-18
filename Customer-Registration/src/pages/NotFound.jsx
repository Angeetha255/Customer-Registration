import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <main className="page-shell">
      <section className="page-panel card">
        <h1>Page not found</h1>
        <p className="subtitle">The page you requested does not exist.</p>
        <button type="button" className="button button-primary" onClick={() => navigate('/')}>Return home</button>
      </section>
    </main>
  )
}
