import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { ArrowLeft, CheckCircle, Copy, Eye, EyeOff } from 'lucide-react'
import { apiPost } from '#/lib/api-client'
import { AuthPageLayout } from '#/components/auth/AuthPageLayout'
import { Button } from '#/components/ui/button'

const CREATE_TENANT_SECRET =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_CREATE_TENANT_SECRET?: string } }).env
      ?.VITE_CREATE_TENANT_SECRET) ||
  ''

interface TenantCreateResponse {
  tenant_id: string
  tenant_code: string
  tenant_name: string
  admin_username: string
  admin_email: string
  admin_initial_password: string
}

const inputClass =
  'w-full rounded-none bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed'

export const Route = createFileRoute('/register')({
  component: RegisterPage,
})

function RegisterPage() {
  const navigate = useNavigate()
  const [tenantName, setTenantName] = useState('')
  const [tenantCode, setTenantCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState<TenantCreateResponse | null>(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [passwordCopied, setPasswordCopied] = useState(false)

  const validateCode = (value: string): boolean => {
    if (value.length < 1 || value.length > 64) return false
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value.toLowerCase())
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
    setTenantCode(value.replace(/^-+|-+$/g, ''))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!tenantName.trim()) return setError('Company name is required')
    if (tenantName.length > 255) return setError('Company name must be 255 characters or less')
    if (!tenantCode.trim()) return setError('Company code is required')
    if (!validateCode(tenantCode)) {
      return setError('Code must be 1–64 characters, lowercase letters, numbers, and hyphens (e.g. acme-corp)')
    }

    setIsSubmitting(true)
    try {
      const headers: Record<string, string> = {}
      if (CREATE_TENANT_SECRET) headers['X-Create-Tenant-Secret'] = CREATE_TENANT_SECRET

      const response = await apiPost<TenantCreateResponse>(
        '/tenants',
        { name: tenantName.trim(), code: tenantCode.trim() },
        { token: null, tenantId: null, headers }
      )
      setCreated(response)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 401) setError('Tenant creation is not authorized.')
      else if (apiErr?.status === 503) setError('Tenant creation is not configured on this server.')
      else setError(typeof apiErr?.detail === 'string' ? apiErr.detail : 'Failed to create tenant. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPassword = () => {
    if (!created?.admin_initial_password) return
    void navigator.clipboard.writeText(created.admin_initial_password)
    setPasswordCopied(true)
    setTimeout(() => setPasswordCopied(false), 2000)
  }

  const goToLogin = () => {
    if (created) {
      navigate({
        to: '/login',
        search: { tenant_code: created.tenant_code, username: created.admin_username },
      })
    }
  }

  if (created) {
    return (
      <AuthPageLayout>
        <div className="w-full max-w-md py-12">
          <div className="bg-[var(--card)]/80 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-8">
            <div className="flex justify-center mb-6">
              <span className="text-2xl font-bold text-[var(--foreground)]">Vitalis</span>
            </div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-none bg-[var(--primary)]/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 text-[var(--primary)]" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[var(--foreground)]">Tenant created</h1>
                <p className="text-sm text-[var(--foreground-muted)]">{created.tenant_name}</p>
              </div>
            </div>
            <p className="text-sm text-[var(--foreground-muted)] mb-4">
              Store the admin password below securely. It is shown only once and cannot be recovered.
            </p>
            <dl className="space-y-0 mb-6">
              <div className="flex items-baseline gap-4 py-3 border-b border-[var(--border)]">
                <dt className="text-sm text-[var(--foreground-muted)] shrink-0 w-28">Tenant code</dt>
                <dd className="text-sm font-mono text-[var(--foreground)] min-w-0">{created.tenant_code}</dd>
              </div>
              <div className="flex items-baseline gap-4 py-3 border-b border-[var(--border)]">
                <dt className="text-sm text-[var(--foreground-muted)] shrink-0 w-28">Username</dt>
                <dd className="text-sm font-mono text-[var(--foreground)] min-w-0">{created.admin_username}</dd>
              </div>
              <div className="flex items-baseline gap-4 py-3 border-b border-[var(--border)]">
                <dt className="text-sm text-[var(--foreground-muted)] shrink-0 w-28">Password</dt>
                <dd className="flex items-center gap-2 min-w-0 flex-1">
                  <code className="text-sm font-mono text-[var(--foreground)] truncate flex-1 select-all">
                    {passwordVisible ? created.admin_initial_password : '••••••••••••••••'}
                  </code>
                  <button
                    type="button"
                    onClick={() => setPasswordVisible((v) => !v)}
                    className="shrink-0 p-1.5 rounded-none border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    {passwordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="shrink-0 p-1.5 rounded-none border border-[var(--border)] text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                    aria-label="Copy password"
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {passwordCopied && (
                    <span className="text-xs text-[var(--primary)] shrink-0">Copied</span>
                  )}
                </dd>
              </div>
            </dl>
            <Button onClick={goToLogin} className="w-full">
              Sign in now
            </Button>
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => { window.location.href = '/' }}
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

  return (
    <AuthPageLayout>
      <div className="w-full max-w-md py-12">
        <div className="bg-[var(--card)]/80 backdrop-blur-md border border-white/10 shadow-xl rounded-lg p-8">
          <div className="flex justify-center mb-6">
            <span className="text-2xl font-bold text-[var(--foreground)]">Vitalis</span>
          </div>

          <h1 className="text-2xl font-bold text-center mb-2 text-[var(--foreground)]">
            Create tenant
          </h1>
          <p className="text-center text-[var(--foreground-muted)] mb-6">
            Enter your company name and code. An admin account and password will be created for you.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-[var(--destructive)]/10 border border-[var(--destructive)]/20 rounded-none">
              <p className="text-sm text-[var(--destructive)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="tenant-name"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                Company name
              </label>
              <input
                id="tenant-name"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                required
                placeholder="Acme Corp"
                disabled={isSubmitting}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                Display name for your organisation
              </p>
            </div>

            <div>
              <label
                htmlFor="tenant-code"
                className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
              >
                Company code
              </label>
              <input
                id="tenant-code"
                type="text"
                value={tenantCode}
                onChange={handleCodeChange}
                required
                placeholder="acme-corp"
                pattern="[a-z0-9\-]+"
                title="Lowercase letters, numbers, and hyphens only"
                disabled={isSubmitting}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                e.g. acme-corp · 1–64 characters (admin account will be created automatically)
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !tenantName.trim() ||
                !tenantCode.trim() ||
                !validateCode(tenantCode)
              }
              className="w-full"
            >
              {isSubmitting ? 'Creating tenant...' : 'Create tenant'}
            </Button>
          </form>

          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-[var(--foreground)] font-medium hover:underline"
              >
                Sign in
              </Link>
            </p>
            <button
              type="button"
              onClick={() => { window.location.href = '/' }}
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
