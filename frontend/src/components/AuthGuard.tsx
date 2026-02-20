import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation, useMatches, useNavigate } from '@tanstack/react-router'
import { loadStoredToken, isAuthenticated } from '@/lib/auth-store'

const AUTH_DISABLED =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_DISABLE_AUTH?: string } }).env?.VITE_DISABLE_AUTH === 'true') ||
  false

const PUBLIC_PATHS = ['/', '/login', '/register'] as const

interface AuthGuardProps {
  /** Rendered when authenticated (main app with sidebar). Not used on /login. */
  children: ReactNode
}

/** Redirects to /login if not authenticated. Landing (/), /login and /register render only <Outlet /> (no AppLayout). Authenticated users on / redirect to /dashboard. Set VITE_DISABLE_AUTH=true to bypass in dev. */
export function AuthGuard({ children }: AuthGuardProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const matches = useMatches()
  const [ready, setReady] = useState(false)

  // Prefer window.location.pathname on client so we're correct even when SSR/hydration has wrong match (e.g. lastMatchId __root__/ for /login)
  const pathname =
    typeof window !== 'undefined' && window.location?.pathname
      ? window.location.pathname
      : location.pathname
  const isPublicPage =
    PUBLIC_PATHS.some((p) => pathname === p) ||
    matches.some(
      (m) => m.routeId === '/' || m.routeId === '/login' || m.routeId === '/register'
    )

  useEffect(() => {
    loadStoredToken()
    setReady(true)
  }, [])

  // When SSR sends wrong match (e.g. __root__/ for /login), sync router to actual pathname so Outlet renders the right page
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (location.pathname !== pathname) {
      navigate({ to: pathname, replace: true })
    }
  }, [pathname, location.pathname, navigate])

  useEffect(() => {
    if (AUTH_DISABLED || !ready) return
    if (isPublicPage) return
    if (!isAuthenticated()) {
      navigate({ to: '/login', search: { tenant_code: '', username: '', redirect: undefined } })
    }
  }, [ready, isPublicPage, navigate])

  useEffect(() => {
    if (!ready || AUTH_DISABLED) return
    const onLanding = pathname === '/' || matches.some((m) => m.routeId === '/')
    if (onLanding && isAuthenticated()) {
      navigate({ to: '/dashboard' })
    }
  }, [ready, pathname, matches, navigate])

  if (!ready && !isPublicPage && !AUTH_DISABLED) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      </div>
    )
  }

  if (isPublicPage) return <Outlet />

  if (!AUTH_DISABLED && !isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Redirecting to login…</p>
      </div>
    )
  }

  return <>{children}</>
}
