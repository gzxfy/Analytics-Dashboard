import { Link, NavLink } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'

export function SiteHeader({ connectionStatus, showStatus = false }) {
  const linkClass = ({ isActive }) =>
    `font-mono text-xs uppercase tracking-wider transition-colors ${
      isActive ? 'text-teal' : 'text-ink-muted hover:text-ink'
    }`

  return (
    <header className="border-b border-line/80 bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link to="/" className="font-sans text-sm font-semibold tracking-tight text-ink no-underline hover:text-teal">
          Event Analytics
        </Link>

        <nav className="flex items-center gap-6">
          <NavLink to="/" end className={linkClass}>
            Overview
          </NavLink>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          {showStatus && connectionStatus ? (
            <StatusBadge status={connectionStatus} />
          ) : null}
        </nav>
      </div>
    </header>
  )
}
