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
      const detail = err && typeof err === 'object' && 'detail' in err ? String((err as { detail: unknown }).detail) : 'Login failed'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm border border-[var(--border)] bg-[var(--card)] p-8 rounded-none">
        <h1 className="text-xl font-semibold text-[var(--foreground)] mb-6">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenant_code" className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Tenant code
            </label>
            <input
              id="tenant_code"
              type="text"
              value={tenantCode}
              onChange={(e) => setTenantCode(e.target.value)}
              required
              autoComplete="organization"
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground-muted)] mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)] focus:outline-none"
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
            className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
