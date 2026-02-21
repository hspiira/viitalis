import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '#/lib/auth-context'
import { useRedirectIfAuthenticated } from '#/lib/hooks'
import { AuthPageLayout } from '#/components/auth/AuthPageLayout'
import { Button } from '#/components/ui/button'

function safeRedirectPath(raw: unknown): string | undefined {
  const s = typeof raw === 'string' ? raw.trim() : ''
  if (!s || !s.startsWith('/') || s.startsWith('//')) return undefined
  return s
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  // Only redirect in URL (like register has no search) so URL stays /login or /login?redirect=...
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: safeRedirectPath(search.redirect),
  }),
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const locationState = useRouterState({ select: (s) => s.location.state }) as
    | { tenant_code?: string; username?: string }
    | undefined
  const [tenantCode, setTenantCode] = useState(
    typeof locationState?.tenant_code === 'string' ? locationState.tenant_code : ''
  )
  const [username, setUsername] = useState(
    typeof locationState?.username === 'string' ? locationState.username : ''
  )
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { login, error, clearError } = useAuth()

  const redirectPath = redirect ?? '/dashboard'
  const redirectPathOnly = redirectPath.includes('?')
    ? redirectPath.slice(0, redirectPath.indexOf('?'))
    : redirectPath

  const isAuthenticated = useRedirectIfAuthenticated(redirectPathOnly)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setIsSubmitting(true)
    try {
      const ok = await login(tenantCode, username, password)
      if (ok) {
        // Full page load so the server serves /dashboard (or index.html for client routing).
        // SPA navigate() can receive 404 HTML and show it as raw text when only __root__/ matches.
        window.location.replace(redirectPathOnly)
        return
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="bg-[var(--card)]/80 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-[var(--foreground)]">
              Vitalis
            </span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-6 text-[var(--foreground)]">
            Sign In
          </h1>

          {error && (
            <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-none">
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="tenant-code"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                Tenant Code
              </label>
              <input
                id="tenant-code"
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value.toLowerCase())}
                required
                placeholder="e.g. acme-corp"
                autoComplete="organization"
                disabled={isSubmitting}
                className="w-full rounded-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="username"
                autoComplete="username"
                disabled={isSubmitting}
                className="w-full rounded-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className="w-full rounded-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] px-3 py-2 pr-10 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-[var(--foreground)] font-medium hover:underline"
              >
                Register your tenant
              </Link>
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/'
              }}
              className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    </AuthPageLayout>
  )
}
