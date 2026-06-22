import { NavLink } from 'react-router-dom'
import './Nav.css'

export default function Nav() {
  return (
    <header className="nav">
      <div className="nav-brand">
        <span className="nav-logo">⚡</span>
        <span>Lead Portal</span>
      </div>
      <nav className="nav-links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/form">Submit a Lead</NavLink>
      </nav>
    </header>
  )
}
