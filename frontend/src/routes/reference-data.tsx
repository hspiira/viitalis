import { createFileRoute, useNavigate } from '@tanstack/react-router'
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
import { TableSkeleton } from '#/components/list-page'
import { Database, Plus, Tag, FileText, Calendar, ToggleRight, Activity, Hash, X, User, Clock, type LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/reference-data')({
  beforeLoad: () => requireAuthBeforeLoad('/reference-data'),
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      typeof search.tab === 'string' && (TAB_IDS as string[]).includes(search.tab)
        ? (search.tab as TabId)
        : DEFAULT_TAB,
  }),
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

const TAB_IDS: TabId[] = TABS.map((t) => t.id)
const DEFAULT_TAB: TabId = 'company-types'

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
  created_at?: string | null
  updated_at?: string | null
  created_by?: string | null
  updated_by?: string | null
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return '—'
  }
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

function DetailRowBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
          <Icon className="size-3.5" aria-hidden />
        </span>
        <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">{label}:</span>
        <span className="text-sm text-[var(--foreground)] break-words min-w-0">{value}</span>
      </div>
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
  const hasDescription = item.description != null && item.description !== ''
  const showDescription = hasDescription && !columns.includes('description')

  return (
    <aside
      className={`flex flex-col min-h-0 rounded-xl border border-[var(--border)] bg-transparent ${className ?? ''}`}
      aria-label="Item details"
    >
      <div className="flex items-start justify-between gap-3 shrink-0 px-4 py-3 border-b border-[var(--border)]">
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
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {columns.map((col) => {
          const meta = columnMeta[col] ?? { label: String(col).replace(/_/g, ' '), icon: Tag }
          const Icon = meta.icon
          const value =
            col === 'is_current'
              ? item.is_current
                ? 'Yes'
                : 'No'
              : (item[col] as string | number | boolean | null | undefined) ?? '—'
          return (
            <DetailRowBlock key={String(col)} icon={Icon} label={meta.label} value={String(value)} />
          )
        })}
        {showDescription && (
          <DetailRowBlock icon={FileText} label="Description" value={item.description!} />
        )}
        {(item.created_by != null && item.created_by !== '') && (
          <DetailRowBlock icon={User} label="Created by" value={item.created_by} />
        )}
        {(item.created_at != null && item.created_at !== '') && (
          <DetailRowBlock icon={Clock} label="Created on" value={formatDateTime(item.created_at)} />
        )}
        {(item.updated_by != null && item.updated_by !== '') && (
          <DetailRowBlock icon={User} label="Updated by" value={item.updated_by} />
        )}
        {(item.updated_at != null && item.updated_at !== '') && (
          <DetailRowBlock icon={Clock} label="Updated on" value={formatDateTime(item.updated_at)} />
        )}
      </div>
    </aside>
  )
}

function ReferenceDataPage() {
  const navigate = useNavigate()
  const { tab: activeTab } = Route.useSearch()
  const { token, tenantId } = useApi()
  const queryClient = useQueryClient()
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

      {/* Standalone tab bar (separate from table) */}
      <div
        className="flex flex-nowrap items-center gap-0 border-b border-[var(--border)] bg-[var(--muted)]/20 overflow-x-auto shrink-0"
        role="tablist"
        aria-label="Reference data categories"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => navigate({ to: '/reference-data', search: { tab: tab.id } })}
            className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table card (left) + Detail card (right), side by side */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch min-h-0">
        {/* Left: table in its own card (companies-style) */}
        <div className="flex flex-1 flex-col min-h-0 rounded-lg border border-[var(--border)] bg-transparent overflow-hidden">
          <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 px-3 shrink-0">
            <div className="ml-auto flex shrink-0">
              <Button onClick={openCreate} size="sm" className="h-8">
                <Plus className="size-3.5 mr-1" aria-hidden />
                Add {singularLabel}
              </Button>
            </div>
          </div>
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
            <div className="min-h-0 overflow-y-auto overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[640px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    {columns.map((col) => {
                      const meta = columnMeta[col] ?? { label: String(col).replace(/_/g, ' '), icon: Tag }
                      const Icon = meta.icon
                      return (
                        <th
                          key={String(col)}
                          className="py-2.5 px-3 text-left font-medium text-[var(--foreground-muted)]"
                        >
                          <span className="inline-flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                              <Icon className="size-3.5" aria-hidden />
                            </span>
                            {meta.label}
                          </span>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const isSelected = selectedId === row.id
                    return (
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
                        className={`border-b border-[var(--border-subtle)] last:border-b-0 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[var(--primary)]/8' : 'hover:bg-[var(--muted)]/20'
                        }`}
                      >
                        {columns.map((col) => {
                          const raw =
                            col === 'is_current'
                              ? row.is_current
                                ? 'Yes'
                                : 'No'
                              : (row[col] as string | number | boolean | null | undefined) ?? '—'
                          const isEmpty = raw === '—'
                          const isName = col === 'name'
                          return (
                            <td
                              key={String(col)}
                              className={`py-2.5 px-3 ${
                                isName
                                  ? 'font-medium text-[var(--foreground)]'
                                  : isEmpty
                                    ? 'text-[var(--foreground-muted)]'
                                    : 'text-[var(--foreground)]'
                              }`}
                            >
                              {String(raw)}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: detail card (standalone, not attached to table) */}
        <div className="hidden lg:flex lg:w-[min(400px,28rem)] lg:shrink-0 lg:flex-col lg:min-h-0">
          <div className="flex flex-1 flex-col min-h-0 rounded-xl border border-[var(--border)] bg-transparent overflow-hidden">
            {selectedId ? (
              (() => {
                const item = items.find((i) => i.id === selectedId)
                return item ? (
                  <ReferenceDetailPanel
                    item={item}
                    columnMeta={columnMeta}
                    columns={columns}
                    onClose={() => setSelectedId(null)}
                    className="flex-1 min-h-0 overflow-hidden p-0"
                  />
                ) : null
              })()
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-8 text-center text-[var(--foreground-muted)] min-h-[200px]">
                <FileText className="size-10 opacity-40" strokeWidth={1.25} aria-hidden />
                <p className="text-sm font-medium">Select an item</p>
                <p className="text-xs max-w-[200px]">Click a row in the table to view its details here.</p>
              </div>
            )}
          </div>
        </div>
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
                  <textarea
                    id="ref-description"
                    value={(formData.description as string) ?? ''}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="Optional"
                    className={inputBase + ' resize-y min-h-[80px]'}
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
