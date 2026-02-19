import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { apiPost } from '#/lib/api-client'
import { setToken, fetchMe, clearAuth } from '#/lib/auth-store'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const [tenantCode, setTenantCode] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiPost<{ access_token: string; token_type: string }>(
        '/auth/login',
        { tenant_code: tenantCode.trim(), username: username.trim(), password },
        { token: null, tenantId: null }
      )
      setToken(res.access_token)
      const me = await fetchMe()
      if (!me) {
        clearAuth()
        setError('Could not load user profile')
        return
      }
      navigate({ to: '/' })
    } catch (err: unknown) {
      const detail =
        err && typeof err === 'object' && 'detail' in err
          ? String((err as { detail: unknown }).detail)
          : 'Login failed'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 overflow-hidden overscroll-none bg-[var(--background)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Centered card */}
        <div className="border border-[var(--border)] bg-[var(--card)] p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Vitalis
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="tenant_code" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Tenant code
              </label>
              <input
                id="tenant_code"
                type="text"
                value={tenantCode}
                onChange={(e) => setTenantCode(e.target.value)}
                required
                autoComplete="organization"
                disabled={loading}
                placeholder="e.g. acme"
                className="w-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--foreground-muted)]"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={loading}
                placeholder="Your username"
                className="w-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--foreground-muted)]"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={loading}
                placeholder="Password"
                className="w-full border border-[var(--border)] bg-[var(--background)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-subtle)] focus:outline-none focus:border-[var(--foreground-muted)]"
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--destructive)]" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-1 bg-[var(--primary)] text-[var(--primary-foreground)] py-3 text-sm font-medium hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2 focus:ring-offset-[var(--card)]"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--foreground-subtle)]">
          Healthcare management platform
        </p>
      </div>
    </div>
  )
}
