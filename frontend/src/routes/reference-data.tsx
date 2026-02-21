import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import { DetailRow, TableSkeleton } from '#/components/list-page'
import { Database, Plus, Tag, FileText, Calendar, ToggleRight, Activity, Hash, X, type LucideIcon } from 'lucide-react'

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

const inputBase =
  'w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent'
const labelBase = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1.5'

function FormField({
  id,
  label,
  icon: Icon,
  children,
  className,
}: {
  id: string
  label: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelBase}>
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          {label}
        </span>
      </label>
      {children}
    </div>
  )
}

function ReferenceDetailPanel({
  item,
  columnMeta,
  columns,
  onClose,
  className,
}: {
  item: BaseItem
  columnMeta: Record<string, { label: string; icon: LucideIcon }>
  columns: (keyof BaseItem)[]
  onClose: () => void
  className?: string
}) {
  return (
    <aside
      className={`flex flex-col min-h-0 border-l border-[var(--border)] bg-[var(--card)] ${className ?? ''}`}
      aria-label="Item details"
    >
      <div className="flex items-start justify-between gap-3 shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">{item.name}</h3>
          <p className="text-xs text-[var(--foreground-muted)] font-mono truncate mt-0.5" title={item.id}>
            {item.id}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-md text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
          title="Close"
          aria-label="Close panel"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <dl className="grid grid-cols-1 gap-2">
          {columns.map((col) => {
            const meta = columnMeta[col] ?? { label: String(col).replace(/_/g, ' ') }
            const value =
              col === 'is_current'
                ? item.is_current
                  ? 'Yes'
                  : 'No'
                : (item[col] as string | number | boolean | null | undefined) ?? '—'
            return <DetailRow key={String(col)} label={meta.label} value={String(value)} />
          })}
        </dl>
      </div>
    </aside>
  )
}

function ReferenceDataPage() {
  const { token, tenantId } = useApi()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabId>('company-types')
  const opts = { token: token ?? undefined, tenantId: tenantId ?? undefined }

  const path = TABS.find((t) => t.id === activeTab)?.path ?? '/company-types'
  const activeLabel = TABS.find((t) => t.id === activeTab)?.label ?? 'Reference'
  const singularLabel = activeLabel.toLowerCase().replace(/s$/, '')

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
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => setSelectedId(null), [activeTab])

  const openCreate = () => {
    setFormData({ name: '', code: '', description: '' })
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
      status: 'active',
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

  const columnMeta: Record<string, { label: string; icon: LucideIcon }> = {
    name: { label: 'Name', icon: Tag },
    code: { label: 'Code', icon: Hash },
    description: { label: 'Description', icon: FileText },
    start_date: { label: 'Start date', icon: Calendar },
    end_date: { label: 'End date', icon: Calendar },
    is_current: { label: 'Current', icon: ToggleRight },
    status: { label: 'Status', icon: Activity },
  }

  if (!tenantId) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Database className="size-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reference data</h1>
            <p className="text-[var(--foreground-muted)] mt-0.5">Sign in and select a tenant to manage reference data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Database className="size-6" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">Reference data</h1>
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
              Company types, groups, departments, financial periods, insurance types, medical conditions.
            </p>
          </div>
        </div>
        <Button onClick={openCreate} className="shrink-0 w-full sm:w-auto">
          <Plus className="size-4 mr-2" aria-hidden />
          Add {singularLabel}
        </Button>
      </div>

      {/* Tab bar — selected tab has background (secondary contrasts with card in light and dark) */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
        <div className="flex flex-wrap gap-0" role="tablist" aria-label="Reference data categories">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--secondary)] text-[var(--foreground)]'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--secondary)]/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content: table + detail panel (events-style) */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden flex flex-col min-h-0">
        {isLoading && <TableSkeleton columns={columns.length} rows={8} />}
        {error && (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-[var(--destructive)]">Failed to load: {(error as Error).message}</p>
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <Empty className="border-0 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Database className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No {activeLabel.toLowerCase()} yet</EmptyTitle>
              <EmptyDescription>Add your first {singularLabel} to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openCreate}>
                <Plus className="size-4 mr-2" aria-hidden />
                Add {singularLabel}
              </Button>
            </EmptyContent>
          </Empty>
        )}
        {!isLoading && !error && items.length > 0 && (
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 min-w-0 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[var(--border)] bg-[var(--muted)]/50">
                  <tr>
                    {columns.map((col) => {
                      const meta = columnMeta[col] ?? { label: String(col).replace(/_/g, ' '), icon: Tag }
                      const Icon = meta.icon
                      return (
                        <th
                          key={String(col)}
                          className="px-4 py-3 font-medium text-[var(--foreground-muted)]"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            {meta.label}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {items.map((row) => (
                    <tr
                      key={row.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(row.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedId(row.id)
                        }
                      }}
                      className={`cursor-pointer text-[var(--foreground)] transition-colors ${
                        selectedId === row.id
                          ? 'bg-[var(--primary)]/10'
                          : 'bg-[var(--card)] hover:bg-[var(--muted)]/30'
                      }`}
                    >
                      {columns.map((col) => (
                        <td key={String(col)} className="px-4 py-3">
                          {col === 'is_current'
                            ? row.is_current
                              ? 'Yes'
                              : 'No'
                            : (row[col] as string | number | boolean | null | undefined) ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hidden lg:flex lg:w-[min(400px,28rem)] lg:shrink-0 lg:flex-col lg:min-h-0 lg:overflow-hidden">
              {selectedId ? (
                (() => {
                  const item = items.find((i) => i.id === selectedId)
                  return item ? (
                    <ReferenceDetailPanel
                      item={item}
                      columnMeta={columnMeta}
                      columns={columns}
                      onClose={() => setSelectedId(null)}
                      className="flex-1 min-h-0 overflow-hidden"
                    />
                  ) : null
                })()
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 flex-1 px-4 py-8 text-center text-[var(--foreground-muted)] min-h-0 border-l border-[var(--border)] bg-[var(--muted)]/20">
                  <FileText className="size-10 opacity-40" strokeWidth={1.25} aria-hidden />
                  <p className="text-sm font-medium">Select an item</p>
                  <p className="text-xs max-w-[200px]">
                    Click a row in the table to view its details here.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && (setCreateOpen(false), setSubmitError(null))}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
          <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Database className="size-5" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">New {singularLabel}</h2>
                <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                  Required fields are marked with *.
                </p>
              </div>
            </div>
          </header>
          <form onSubmit={handleCreate} className="flex flex-col">
            <div className="flex-1 px-6 py-5 space-y-4">
              <FormField id="ref-name" label="Name *" icon={Tag}>
                <input
                  id="ref-name"
                  type="text"
                  value={(formData.name as string) ?? ''}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="e.g. Standard"
                  className={inputBase}
                />
              </FormField>
              {activeTab !== 'company-groups' && (
                <FormField id="ref-code" label="Code" icon={Tag}>
                  <input
                    id="ref-code"
                    type="text"
                    value={(formData.code as string) ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value }))}
                    placeholder="Optional"
                    className={inputBase}
                  />
                </FormField>
              )}
              {(activeTab === 'company-types' || activeTab === 'company-groups') && (
                <FormField id="ref-description" label="Description" icon={FileText}>
                  <input
                    id="ref-description"
                    type="text"
                    value={(formData.description as string) ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Optional"
                    className={inputBase}
                  />
                </FormField>
              )}
              {activeTab === 'financial-periods' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField id="ref-start" label="Start date *" icon={Calendar}>
                      <input
                        id="ref-start"
                        type="date"
                        value={(formData.start_date as string) ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                        className={inputBase}
                      />
                    </FormField>
                    <FormField id="ref-end" label="End date *" icon={Calendar}>
                      <input
                        id="ref-end"
                        type="date"
                        value={(formData.end_date as string) ?? ''}
                        onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                        className={inputBase}
                      />
                    </FormField>
                  </div>
                  <FormField id="ref-current" label="Current period" icon={ToggleRight}>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        id="ref-current"
                        type="checkbox"
                        checked={Boolean(formData.is_current)}
                        onChange={(e) => setFormData((p) => ({ ...p, is_current: e.target.checked }))}
                        className="rounded border-[var(--input)] text-[var(--primary)] focus:ring-[var(--ring)]"
                      />
                      <span className="text-sm text-[var(--foreground-muted)]">Mark as current period</span>
                    </label>
                  </FormField>
                </>
              )}
              {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => (setCreateOpen(false), setSubmitError(null))}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="min-w-[100px]">
                {createMutation.isPending ? 'Saving…' : 'Create'}
              </Button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
