import { Link, useNavigate } from '@tanstack/react-router'
import { getAuthUser, clearAuth } from '#/lib/auth-store'

export default function Header() {
  const navigate = useNavigate()
  const user = getAuthUser()

  function handleLogout() {
    clearAuth()
    navigate({ to: '/login' })
  }

  return (
    <header className="fixed left-0 right-0 z-20 flex h-14 shrink-0 items-center justify-between bg-[var(--background)] px-6">
      <Link to="/dashboard" className="text-lg font-semibold text-[var(--foreground)]">
        Vitalis
      </Link>
      <nav className="flex items-center gap-4">
        <Link to="/docs" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
          API Docs
        </Link>
        <Link to="/health" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
          Health
        </Link>
        {user && (
          <span className="text-sm text-[var(--foreground-muted)]">
            {user.full_name || user.username}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          Sign out
        </button>
      </nav>
    </header>
  )
}
