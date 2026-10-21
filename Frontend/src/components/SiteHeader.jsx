import { Link, NavLink } from 'react-router-dom'
import { StatusBadge } from './StatusBadge'

export function SiteHeader({ connectionStatus, showStatus = false }) {
  return (
    <header className="site-header">
      <div className="shell site-header__inner">
        <Link to="/" className="site-header__brand">
          Event Analytics
        </Link>

        <nav className="site-header__nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `site-header__link${isActive ? ' is-active' : ''}`
            }
          >
            Overview
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `site-header__link${isActive ? ' is-active' : ''}`
            }
          >
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
