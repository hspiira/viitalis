import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  apiGet,
  apiPost,
  getApiErrorDetail,
} from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'
import { TablePagination } from '#/components/list-page'

export const Route = createFileRoute('/card-replacements')({
  beforeLoad: () => requireAuthBeforeLoad('/card-replacements'),
  component: CardReplacementsPage,
})

interface CardReplacement {
  id: string
  tenant_id: string
  member_id: string | null
  dependant_id: string | null
  reason_id: string
  old_card_no: string | null
  new_card_no: string | null
  requested_at: string
  status: string
}

interface CardReplacementReason {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function CardReplacementsPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [skip, setSkip] = useState(0)
  const limit = 20
  const [showForm, setShowForm] = useState(false)
  const [memberId, setMemberId] = useState('')
  const [dependantId, setDependantId] = useState('')
  const [reasonId, setReasonId] = useState('')
  const [oldCardNo, setOldCardNo] = useState('')
  const [newCardNo, setNewCardNo] = useState('')
  const [approveOverride, setApproveOverride] = useState<Record<string, string>>({})

  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (statusFilter) params.set('status', statusFilter)

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['card-replacements', skip, limit, statusFilter, opts.tenantId],
    queryFn: () =>
      apiGet<CardReplacement[]>(`/card-replacements?${params}`, opts),
    enabled: !!opts.tenantId,
  })

  const { data: reasons = [] } = useQuery({
    queryKey: ['card-replacement-reasons', opts.tenantId],
    queryFn: () => apiGet<CardReplacementReason[]>('/card-replacement-reasons', opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: {
      member_id?: string
      dependant_id?: string
      reason_id: string
      old_card_no?: string
      new_card_no?: string
    }) => apiPost<CardReplacement>('/card-replacements', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-replacements'] })
      setShowForm(false)
      setMemberId('')
      setDependantId('')
      setReasonId('')
      setOldCardNo('')
      setNewCardNo('')
    },
  })

  const approveMutation = useMutation({
    mutationFn: ({
      id,
      new_card_no,
    }: { id: string; new_card_no?: string }) =>
      apiPost<CardReplacement>(
        `/card-replacements/${id}/approve`,
        new_card_no ? { new_card_no } : undefined,
        opts
      ),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['card-replacements'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reasonId.trim()) return
    if (memberId && dependantId) return
    if (!memberId && !dependantId) return
    createMutation.mutate({
      member_id: memberId.trim() || undefined,
      dependant_id: dependantId.trim() || undefined,
      reason_id: reasonId.trim(),
      old_card_no: oldCardNo.trim() || undefined,
      new_card_no: newCardNo.trim() || undefined,
    })
  }

  const handleApprove = (r: CardReplacement, override?: string) => {
    approveMutation.mutate({
      id: r.id,
      new_card_no: override?.trim() || undefined,
    })
  }

  if (!opts.tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Card replacements
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage card replacement requests.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Card replacements
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'New request'}
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
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
        </select>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3"
        >
          <p className="text-sm text-[var(--foreground-muted)]">
            Provide either member_id or dependant_id, not both.
          </p>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Member ID
            </label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Dependant ID
            </label>
            <input
              type="text"
              value={dependantId}
              onChange={(e) => setDependantId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Reason *
            </label>
            <select
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            >
              <option value="">Select reason</option>
              {reasons.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Old card no
            </label>
            <input
              type="text"
              value={oldCardNo}
              onChange={(e) => setOldCardNo(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              New card no
            </label>
            <input
              type="text"
              value={newCardNo}
              onChange={(e) => setNewCardNo(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
            />
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
                <th className="text-left py-2 font-medium">Member / Dependant</th>
                <th className="text-left py-2 font-medium">Old → New</th>
                <th className="text-left py-2 font-medium">Requested</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[var(--border-subtle)]"
                >
                  <td className="py-2">
                    {r.member_id ?? r.dependant_id ?? '—'}
                  </td>
                  <td className="py-2">
                    {r.old_card_no ?? '—'} → {r.new_card_no ?? '—'}
                  </td>
                  <td className="py-2">{r.requested_at.slice(0, 10)}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">
                    {r.status === 'requested' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Override new card no"
                          value={approveOverride[r.id] ?? ''}
                          onChange={(e) =>
                            setApproveOverride((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                          className="w-32 border border-[var(--input)] bg-[var(--background)] px-2 py-1 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleApprove(r, approveOverride[r.id])
                          }
                          disabled={approveMutation.isPending}
                          className="text-[var(--primary)] text-sm disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
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
