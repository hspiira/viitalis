import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'

export const Route = createFileRoute('/reference-data')({
  beforeLoad: () => requireAuthBeforeLoad('/reference-data'),
  component: ReferenceDataPage,
})

type TabId =
  | 'company-types'
  | 'company-groups'
  | 'departments'
  | 'financial-periods'
  | 'insurance-types'
  | 'medical-conditions'

const TABS: { id: TabId; label: string; path: string }[] = [
  { id: 'company-types', label: 'Company types', path: '/company-types' },
  { id: 'company-groups', label: 'Company groups', path: '/company-groups' },
  { id: 'departments', label: 'Departments', path: '/departments' },
  { id: 'financial-periods', label: 'Financial periods', path: '/financial-periods' },
  { id: 'insurance-types', label: 'Insurance types', path: '/insurance-types' },
  { id: 'medical-conditions', label: 'Medical conditions', path: '/medical-conditions' },
]

interface BaseItem {
  id: string
  tenant_id: string
  name: string
  code?: string | null
  status: string
  description?: string | null
  start_date?: string
  end_date?: string
  is_current?: boolean
}

function ReferenceDataPage() {
  const { token, tenantId } = useApi()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('company-types')
  const opts = { token: token ?? undefined, tenantId: tenantId ?? undefined }

  const path = TABS.find((t) => t.id === activeTab)?.path ?? '/company-types'

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['reference', path, tenantId],
    queryFn: () => apiGet<BaseItem[]>(path, opts),
    enabled: !!token && !!tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<BaseItem>(path, body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference', path] })
      setCreateOpen(false)
      setFormData({})
    },
    onError: (err: { status?: number; detail?: unknown }) => {
      setSubmitError(getApiErrorDetail(err as { status: number; detail: unknown }))
    },
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [formData, setFormData] = useState<Record<string, string | boolean>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const openCreate = () => {
    setFormData({ name: '', code: '', status: 'active', description: '' })
    if (activeTab === 'financial-periods') {
      setFormData((p) => ({ ...p, start_date: '', end_date: '', is_current: false }))
    }
    setSubmitError(null)
    setCreateOpen(true)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    const name = (formData.name as string)?.trim()
    if (!name) {
      setSubmitError('Name is required')
      return
    }
    const body: Record<string, unknown> = {
      name,
      code: (formData.code as string)?.trim() || undefined,
      status: (formData.status as string) || 'active',
    }
    if (activeTab === 'company-types' || activeTab === 'company-groups') {
      body.description = (formData.description as string)?.trim() || undefined
    }
    if (activeTab === 'financial-periods') {
      const startDate = (formData.start_date as string)?.trim()
      const endDate = (formData.end_date as string)?.trim()
      if (!startDate || !endDate) {
        setSubmitError('Start date and end date are required for financial periods')
        return
      }
      body.start_date = startDate
      body.end_date = endDate
      body.is_current = Boolean(formData.is_current)
    }
    createMutation.mutate(body)
  }

  const columns: (keyof BaseItem)[] =
    activeTab === 'financial-periods'
      ? ['name', 'start_date', 'end_date', 'is_current', 'status']
      : activeTab === 'company-types' || activeTab === 'company-groups'
        ? ['name', 'code', 'description', 'status']
        : ['name', 'code', 'status']

  if (!tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Reference data</h1>
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to manage reference data.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reference data</h1>
          <p className="text-[var(--foreground-muted)] mt-0.5">
            Company types, groups, departments, financial periods, insurance types, medical conditions.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Add {TABS.find((t) => t.id === activeTab)?.label.toLowerCase().replace(/s$/, '') ?? 'item'}
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[var(--border)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-sm font-medium ${
              activeTab === tab.id
                ? 'text-[var(--foreground-active)] border-b-2 border-[var(--primary)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {createOpen && (
        <div className="mb-4 p-4 border border-[var(--border)] bg-[var(--card)]">
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-3">New item</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-4 items-end">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground-muted)]">Name</span>
              <input
                type="text"
                value={(formData.name as string) ?? ''}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[12rem]"
                required
              />
            </label>
            {activeTab !== 'company-groups' && (
              <label className="flex flex-col gap-1">
                <span className="text-sm text-[var(--foreground-muted)]">Code</span>
                <input
                  type="text"
                  value={(formData.code as string) ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                  className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] w-24"
                />
              </label>
            )}
            {(activeTab === 'company-types' || activeTab === 'company-groups') && (
              <label className="flex flex-col gap-1">
                <span className="text-sm text-[var(--foreground-muted)]">Description</span>
                <input
                  type="text"
                  value={(formData.description as string) ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[14rem]"
                />
              </label>
            )}
            {activeTab === 'financial-periods' && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-[var(--foreground-muted)]">Start date</span>
                  <input
                    type="date"
                    value={(formData.start_date as string) ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                    className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-[var(--foreground-muted)]">End date</span>
                  <input
                    type="date"
                    value={(formData.end_date as string) ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                    className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.is_current)}
                    onChange={(e) => setFormData((p) => ({ ...p, is_current: e.target.checked }))}
                    className="rounded border-[var(--input)]"
                  />
                  <span className="text-sm text-[var(--foreground-muted)]">Current period</span>
                </label>
              </>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm text-[var(--foreground-muted)]">Status</span>
              <select
                value={(formData.status as string) ?? 'active'}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value }))}
                className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
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
                onClick={() => setCreateOpen(false)}
                className="border border-[var(--border)] px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
          {submitError && <p className="mt-2 text-sm text-[var(--destructive)]">{submitError}</p>}
        </div>
      )}

      {isLoading && <p className="text-[var(--foreground-muted)]">Loading…</p>}
      {error && (
        <p className="text-[var(--destructive)]">Failed to load: {(error as Error).message}</p>
      )}
      {!isLoading && !error && (
        <div className="border border-[var(--border)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--muted)] text-[var(--foreground-muted)]">
              <tr>
                {columns.map((col) => (
                  <th key={String(col)} className="px-4 py-2 font-medium capitalize">
                    {String(col).replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-[var(--foreground)]">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-4 py-6 text-center text-[var(--foreground-muted)]">
                    No items. Add one above.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border-subtle)]">
                    {columns.map((col) => (
                      <td key={String(col)} className="px-4 py-2">
                        {col === 'is_current'
                          ? row.is_current
                            ? 'Yes'
                            : 'No'
                          : (row[col] as string | number | boolean | null | undefined) ?? '—'}
                      </td>
                    ))}
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
