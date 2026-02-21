import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/doctors')({
  beforeLoad: () => requireAuthBeforeLoad('/doctors'),
  component: DoctorsPage,
})

interface Doctor {
  id: string
  tenant_id: string
  hospital_id: string
  name: string
  specialization: string | null
}

interface Hospital {
  id: string
  tenant_id: string
  name: string
  address: string | null
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function DoctorsPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [skip, setSkip] = useState(0)
  const limit = 20
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [hospitalId, setHospitalId] = useState('')
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')

  const listParams = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  if (hospitalFilter) listParams.set('hospital_id', hospitalFilter)

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['doctors', skip, limit, hospitalFilter, opts.tenantId],
    queryFn: () => apiGet<Doctor[]>(`/doctors?${listParams}`, opts),
    enabled: !!opts.tenantId,
  })

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals', opts.tenantId],
    queryFn: () => apiGet<Hospital[]>(`/hospitals?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: { hospital_id: string; name: string; specialization?: string }) =>
      apiPost<Doctor>('/doctors', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctors'] })
      setShowForm(false)
      setHospitalId('')
      setName('')
      setSpecialization('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!hospitalId.trim() || !name.trim()) return
    createMutation.mutate({
      hospital_id: hospitalId.trim(),
      name: name.trim(),
      specialization: specialization.trim() || undefined,
    })
  }

  if (!opts.tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Doctors
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage doctors.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Doctors
        </h1>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Add doctor'}
        </button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm text-[var(--foreground-muted)]">Hospital</label>
        <select
          value={hospitalFilter}
          onChange={(e) => setHospitalFilter(e.target.value)}
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
        >
          <option value="">All</option>
          {hospitals.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3"
        >
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">
              Hospital *
            </label>
            <select
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
              required
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
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
              Specialization
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
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
                <th className="text-left py-2 font-medium">Specialization</th>
                <th className="text-left py-2 font-medium">Hospital ID</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2">{r.specialization ?? '—'}</td>
                  <td className="py-2">{r.hospital_id}</td>
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
