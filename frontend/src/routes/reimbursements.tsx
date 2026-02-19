import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'

export const Route = createFileRoute('/reimbursements')({
  component: ReimbursementsPage,
})

interface Reimbursement {
  id: string
  tenant_id: string
  claim_id: string
  amount: string
  status: string
}

function useReimbursementsList(opts: { token: string | null; tenantId: string | null }) {
  return useQuery({
    queryKey: ['reimbursements', opts.tenantId],
    queryFn: async () => {
      const res = await apiGet<Reimbursement[]>('/reimbursements', {
        token: opts.token ?? undefined,
        tenantId: opts.tenantId ?? undefined,
      })
      return res ?? []
    },
    enabled: !!opts.token && !!opts.tenantId,
  })
}

function ReimbursementsPage() {
  const { token, tenantId } = useApi()
  const queryClient = useQueryClient()
  const { data: items = [], isLoading, error } = useReimbursementsList({ token, tenantId })
  const [showForm, setShowForm] = useState(false)
  const [claimId, setClaimId] = useState('')
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState('pending')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: async (body: { claim_id: string; amount: string; status: string }) => {
      return apiPost<Reimbursement>('/reimbursements', body, {
        token: token ?? undefined,
        tenantId: tenantId ?? undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reimbursements'] })
      setShowForm(false)
      setClaimId('')
      setAmount('')
      setStatus('pending')
      setSubmitError(null)
    },
    onError: (err: { detail?: string }) => {
      setSubmitError(getApiErrorDetail(err as { status: number; detail: unknown }))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!claimId.trim() || !amount.trim()) {
      setSubmitError('Claim ID and amount are required')
      return
    }
    const num = parseFloat(amount)
    if (Number.isNaN(num) || num <= 0) {
      setSubmitError('Amount must be a positive number')
      return
    }
    createMutation.mutate({ claim_id: claimId.trim(), amount, status })
  }

  const filtered = items

  return (
    <div className="px-8 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reimbursements</h1>
          <p className="text-[var(--foreground-muted)] mt-0.5">
            List and create reimbursement records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Add reimbursement
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)]">
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">New reimbursement</h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground-muted)]">Claim ID</span>
              <input
                type="text"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
                className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[12rem]"
                placeholder="Claim ID"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground-muted)]">Amount</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] w-28"
                placeholder="0.00"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground-muted)]">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[8rem]"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setSubmitError(null)
                }}
                className="border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                Cancel
              </button>
            </div>
          </form>
          {submitError && (
            <p className="mt-2 text-sm text-[var(--destructive)]" role="alert">
              {submitError}
            </p>
          )}
        </div>
      )}

      {!tenantId && (
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to view reimbursements.</p>
      )}
      {tenantId && isLoading && (
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      )}
      {tenantId && error && (
        <p className="text-[var(--destructive)]" role="alert">
          Failed to load: {(error as Error).message}
        </p>
      )}
      {tenantId && !isLoading && !error && (
        <div className="border border-[var(--border)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)] text-[var(--foreground-muted)]">
              <tr>
                <th className="px-4 py-2 font-medium">Claim ID</th>
                <th className="px-4 py-2 font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="text-[var(--foreground)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[var(--foreground-muted)]">
                    No reimbursements yet. Add one above.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="border-t border-[var(--border-subtle)]">
                    <td className="px-4 py-2">{r.claim_id}</td>
                    <td className="px-4 py-2">{r.amount}</td>
                    <td className="px-4 py-2">{r.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
