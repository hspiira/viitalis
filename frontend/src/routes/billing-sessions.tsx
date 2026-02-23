import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'
import { TablePagination } from '#/components/list-page'

export const Route = createFileRoute('/billing-sessions')({
  beforeLoad: () => requireAuthBeforeLoad('/billing-sessions'),
  component: BillingSessionsPage,
})

interface BillingSession {
  id: string
  tenant_id: string
  name: string
  session_date: string
  from_date: string | null
  to_date: string | null
  total_claims: number | null
  total_amount: number | string | null
  status: string
  created_by: string | null
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function BillingSessionsPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 20
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [sessionDate, setSessionDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (statusFilter) params.set('status', statusFilter)

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['billing-sessions', skip, limit, statusFilter, opts.tenantId],
    queryFn: () =>
      apiGet<BillingSession[]>(`/billing-sessions?${params}`, opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: {
      name: string
      session_date: string
      from_date?: string
      to_date?: string
    }) => apiPost<BillingSession>('/billing-sessions', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-sessions'] })
      setShowForm(false)
      setName('')
      setSessionDate(new Date().toISOString().slice(0, 10))
      setFromDate('')
      setToDate('')
    },
  })

  const closeMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiPost<BillingSession>(`/billing-sessions/${sessionId}/close`, undefined, opts),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['billing-sessions'] }),
  })

  const disableMutation = useMutation({
    mutationFn: (sessionId: string) =>
      apiPost<BillingSession>(
        `/billing-sessions/${sessionId}/disable`,
        undefined,
        opts
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['billing-sessions'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({
      name: name.trim(),
      session_date: sessionDate,
      from_date: fromDate || undefined,
      to_date: toDate || undefined,
    })
  }

  if (!opts.tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Billing sessions
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage billing sessions.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Billing sessions
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'New session'}
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-[var(--foreground-muted)]">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3"
        >
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Session date
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                From date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">
                To date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              />
            </div>
          </div>
          {createMutation.isError && (
            <p className="text-sm text-[var(--destructive)]">
              {getApiErrorDetail(createMutation.error as { detail?: string })}
            </p>
          )}
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {createMutation.isPending ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {error && (
        <p className="text-[var(--destructive)] mb-4">
          {getApiErrorDetail(error as { detail?: string })}
        </p>
      )}
      {isLoading ? (
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">Name</th>
                <th className="text-left py-2 font-medium">Session date</th>
                <th className="text-left py-2 font-medium">From / To</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Claims / Amount</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-[var(--border-subtle)]"
                >
                  <td className="py-2">{s.name}</td>
                  <td className="py-2">{s.session_date}</td>
                  <td className="py-2">
                    {s.from_date ?? '—'} / {s.to_date ?? '—'}
                  </td>
                  <td className="py-2">{s.status}</td>
                  <td className="py-2">
                    {s.total_claims ?? '—'} / {String(s.total_amount ?? '—')}
                  </td>
                  <td className="py-2 flex gap-2">
                    {s.status === 'open' && (
                      <>
                        <button
                          type="button"
                          onClick={() => closeMutation.mutate(s.id)}
                          disabled={closeMutation.isPending}
                          className="text-[var(--primary)] text-sm disabled:opacity-50"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => disableMutation.mutate(s.id)}
                          disabled={disableMutation.isPending}
                          className="text-[var(--destructive)] text-sm disabled:opacity-50"
                        >
                          Disable
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TablePagination
        skip={skip}
        limit={limit}
        currentPageSize={items.length}
        onSkipChange={setSkip}
      />
    </div>
  )
}
