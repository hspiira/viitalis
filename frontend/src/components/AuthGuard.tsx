import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router'
import { loadStoredToken, isAuthenticated } from '@/lib/auth-store'

const AUTH_DISABLED =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_DISABLE_AUTH?: string } }).env?.VITE_DISABLE_AUTH === 'true') ||
  false

interface AuthGuardProps {
  /** Rendered when authenticated (main app with sidebar). Not used on /login. */
  children: ReactNode
}

/** Redirects to /login if not authenticated. On /login renders only <Outlet /> (no AppLayout). Set VITE_DISABLE_AUTH=true to bypass in dev. */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const routerState = useRouterState()
  const [ready, setReady] = useState(false)

  const path = routerState.location.pathname
  const isLogin = path === '/login'

  useEffect(() => {
    loadStoredToken()
    setReady(true)
  }, [])

  useEffect(() => {
    if (AUTH_DISABLED || !ready) return
    if (isLogin) return
    if (!isAuthenticated()) {
      navigate({ to: '/login' })
    }
  }, [ready, isLogin, navigate])

  if (!ready && !isLogin && !AUTH_DISABLED) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      </div>
    )
  }

  if (isLogin) return <Outlet />

  if (!AUTH_DISABLED && !isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Redirecting to login…</p>
      </div>
    )
  }

  return <>{children}</>
}
