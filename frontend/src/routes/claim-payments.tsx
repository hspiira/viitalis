import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/claim-payments')({
  beforeLoad: () => requireAuthBeforeLoad('/claim-payments'),
  component: ClaimPaymentsPage,
})

interface ClaimPayment {
  id: string
  tenant_id: string
  claim_id: string
  amount: number | string
  payment_date: string
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function ClaimPaymentsPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [skip, setSkip] = useState(0)
  const limit = 20

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['claim-payments', skip, limit, opts.tenantId],
    queryFn: () =>
      apiGet<ClaimPayment[]>(
        `/claim-payments?skip=${skip}&limit=${limit}`,
        opts
      ),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: { claim_id: string; amount: number; payment_date: string }) =>
      apiPost<ClaimPayment>('/claim-payments', body, opts),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['claim-payments'] }),
  })

  const [claimId, setClaimId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [showForm, setShowForm] = useState(false)

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!claimId.trim() || Number.isNaN(amt) || amt <= 0) return
    createMutation.mutate(
      { claim_id: claimId.trim(), amount: amt, payment_date: paymentDate },
      {
        onSuccess: () => {
          setClaimId('')
          setAmount('')
          setPaymentDate(new Date().toISOString().slice(0, 10))
          setShowForm(false)
        },
      }
    )
  }

  if (!opts.tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Claim payments
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to view claim payments.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Claim payments
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Record payment'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3"
        >
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Claim ID
            </label>
            <input
              type="text"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Amount
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Payment date
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
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
            {createMutation.isPending ? 'Saving…' : 'Save'}
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
                <th className="text-left py-2 font-medium">Claim ID</th>
                <th className="text-left py-2 font-medium">Amount</th>
                <th className="text-left py-2 font-medium">Payment date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{p.claim_id}</td>
                  <td className="py-2">{String(p.amount)}</td>
                  <td className="py-2">{p.payment_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length >= limit && (
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setSkip((s) => Math.max(0, s - limit))}
            disabled={skip === 0}
            className="text-sm text-[var(--foreground-muted)] disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setSkip((s) => s + limit)}
            className="text-sm text-[var(--foreground-muted)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
