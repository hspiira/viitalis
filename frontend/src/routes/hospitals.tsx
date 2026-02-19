import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/hospitals')({
  component: HospitalsPage,
})

interface Hospital {
  id: string
  tenant_id: string
  name: string
  address: string | null
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function HospitalsPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [skip, setSkip] = useState(0)
  const limit = 20
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['hospitals', skip, limit, opts.tenantId],
    queryFn: () =>
      apiGet<Hospital[]>(`/hospitals?skip=${skip}&limit=${limit}`, opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: { name: string; address?: string }) =>
      apiPost<Hospital>('/hospitals', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      setShowForm(false)
      setName('')
      setAddress('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), address: address.trim() || undefined })
  }

  if (!opts.tenantId) {
    return (
      <div className="px-8 py-12 max-w-4xl">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Hospitals
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage hospitals.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Hospitals
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Add hospital'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3"
        >
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
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
              Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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
                <th className="text-left py-2 font-medium">Name</th>
                <th className="text-left py-2 font-medium">Address</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.address ?? '—'}</td>
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
