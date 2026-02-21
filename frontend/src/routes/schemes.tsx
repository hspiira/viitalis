import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap, formatCurrency } from '#/lib/utils'
import { useRowSelection, isAllSelected } from '#/hooks/use-row-selection'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/components/ui/dialog'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '#/components/ui/pagination'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Shield,
  Search,
  Filter,
  Building2,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/schemes')({
  beforeLoad: () => requireAuthBeforeLoad('/schemes'),
  component: SchemesPage,
})

interface Scheme {
  id: string
  tenant_id: string
  company_id: string
  name: string
  description: string | null
  limit_value: number | null
  begin_date: string | null
  end_date: string | null
  termination_date: string | null
  status: string
}

interface CompanyRef {
  id: string
  name: string
}

const LIMIT = 20

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'terminated', label: 'Terminated' },
]

function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  const color =
    s === 'active'
      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
      : s === 'terminated'
        ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40'
        : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <span
        className={`size-1.5 rounded-full ${
          s === 'active' ? 'bg-emerald-500' : s === 'terminated' ? 'bg-red-500' : 'bg-gray-400'
        }`}
      />
      {status || '—'}
    </span>
  )
}

function SchemesPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [detailSchemeId, setDetailSchemeId] = useState<string | null>(null)
  const [editSchemeId, setEditSchemeId] = useState<string | null>(null)
  const { selectedIds, toggleAll, toggleOne, clearSelection } = useRowSelection()

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })
  if (companyFilter) params.set('company_id', companyFilter)

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['schemes', skip, LIMIT, companyFilter, opts.tenantId],
    queryFn: () => apiGet<Scheme[]>(`/schemes?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<CompanyRef[]>('/companies', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const companyById = useMemo(() => buildIdToEntityMap(companies), [companies])

  const filteredItems = useMemo(() => {
    let result = items
    if (statusFilter) {
      result = result.filter((s) => (s.status || '').toLowerCase() === statusFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.description || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [items, statusFilter, searchQuery])

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Schemes</h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage schemes.
        </p>
      </div>
    )
  }

  const itemIds = useMemo(() => filteredItems.map((s) => s.id), [filteredItems])
  const allSelected = isAllSelected(itemIds, selectedIds)
  const someSelected = selectedIds.size > 0
  const handleToggleAll = () => toggleAll(itemIds)

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-0 max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Search schemes"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search schemes"
          />
        </div>
        <div className="flex h-8 w-[140px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Building2 className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={companyFilter}
            onChange={(e) => {
              setCompanyFilter(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Company"
          >
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex h-8 w-[120px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Filter className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                Status: {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sort">
            <ArrowUpDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
            <MoreHorizontal className="size-3.5" />
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            New scheme
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-2 py-2">
          <p className="text-[var(--destructive)]">
            {getApiErrorDetail(error as { detail?: string })}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <SchemeTableSkeleton />
      ) : filteredItems.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No schemes</EmptyTitle>
            <EmptyDescription>
              No schemes match your filters. Try changing the filters or create a new scheme.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              onClick={() => {
                setCompanyFilter('')
                setStatusFilter('')
                setSearchQuery('')
                setSkip(0)
                refetch()
              }}
            >
              Clear filters
            </Button>
            <Button onClick={() => setShowCreate(true)}>New scheme</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="w-10 py-2.5 pl-3 pr-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleToggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Company</th>
                  <th className="text-right py-2.5 px-3 font-medium">Limit</th>
                  <th className="text-left py-2.5 px-3 font-medium">Period</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((scheme) => (
                  <tr
                    key={scheme.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      selectedIds.has(scheme.id) ? 'bg-[var(--muted)]/40' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <Checkbox
                        checked={selectedIds.has(scheme.id)}
                        onCheckedChange={() => toggleOne(scheme.id)}
                        aria-label={`Select ${scheme.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      <div>{scheme.name}</div>
                      {scheme.description && (
                        <div className="text-xs text-[var(--foreground-muted)] truncate max-w-[240px]">
                          {scheme.description}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {companyById[scheme.company_id]?.name ?? scheme.company_id}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {scheme.limit_value != null
                        ? formatCurrency(Number(scheme.limit_value))
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)] text-xs">
                      {scheme.begin_date || scheme.end_date
                        ? `${scheme.begin_date ? format(new Date(scheme.begin_date), 'dd MMM yyyy') : '—'} – ${scheme.end_date ? format(new Date(scheme.end_date), 'dd MMM yyyy') : '—'}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={scheme.status} />
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailSchemeId(scheme.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {someSelected && (
            <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--muted)]/30 px-4 py-2.5 text-sm">
              <span className="text-[var(--foreground-muted)]">
                {selectedIds.size} scheme{selectedIds.size !== 1 ? 's' : ''} selected
              </span>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5 mr-1" aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear selection
              </Button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 py-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
                    disabled={skip === 0}
                  >
                    Previous
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="px-2 text-sm text-[var(--foreground-muted)]">
                    {Math.floor(skip / LIMIT) + 1}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => items.length === LIMIT && setSkip((s) => s + LIMIT)}
                    disabled={items.length < LIMIT}
                  >
                    Next
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}

      <CreateSchemeDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        companies={companies}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['schemes'] })
        }}
      />

      <SchemeDetailDialog
        schemeId={detailSchemeId ?? ''}
        open={!!detailSchemeId}
        onOpenChange={(open) => !open && setDetailSchemeId(null)}
        companyById={companyById}
        onEdit={(id) => {
          setDetailSchemeId(null)
          setEditSchemeId(id)
        }}
      />

      <EditSchemeDialog
        schemeId={editSchemeId ?? ''}
        open={!!editSchemeId}
        onOpenChange={(open) => !open && setEditSchemeId(null)}
        companies={companies}
        onSuccess={() => {
          setEditSchemeId(null)
          queryClient.invalidateQueries({ queryKey: ['schemes'] })
          queryClient.invalidateQueries({ queryKey: ['scheme'] })
        }}
      />
    </div>
  )
}

/* ─── Skeleton ─── */

function SchemeTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
            <th className="w-10 py-2.5 pl-3 pr-2"><span className="sr-only">Select</span></th>
            <th className="text-left py-2.5 px-3 font-medium">Name</th>
            <th className="text-left py-2.5 px-3 font-medium">Company</th>
            <th className="text-right py-2.5 px-3 font-medium">Limit</th>
            <th className="text-left py-2.5 px-3 font-medium">Period</th>
            <th className="text-left py-2.5 px-3 font-medium">Status</th>
            <th className="text-left py-2.5 px-3 w-20">Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)]">
              <td className="py-2.5 pl-3 pr-2"><Skeleton className="h-4 w-4" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-4 w-28" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-4 w-24" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-4 w-20" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-4 w-32" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-4 w-16" /></td>
              <td className="py-2.5 px-3"><Skeleton className="h-6 w-14" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Shared form ─── */

interface SchemeFormFields {
  company_id: string
  name: string
  description: string
  limit_value: string
  begin_date: string
  end_date: string
  status: string
}

const EMPTY_FORM: SchemeFormFields = {
  company_id: '',
  name: '',
  description: '',
  limit_value: '',
  begin_date: '',
  end_date: '',
  status: 'active',
}

function useSchemeForm(initial: SchemeFormFields = EMPTY_FORM) {
  const [fields, setFields] = useState<SchemeFormFields>(initial)

  const update = (key: keyof SchemeFormFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const reset = (values: SchemeFormFields = EMPTY_FORM) => setFields(values)

  const toPayload = () => ({
    company_id: fields.company_id,
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    limit_value: fields.limit_value ? Number(fields.limit_value) : null,
    begin_date: fields.begin_date || null,
    end_date: fields.end_date || null,
    status: fields.status,
  })

  return { fields, update, reset, toPayload }
}

function SchemeFormBody({
  fields,
  update,
  companies,
  hideCompany,
  showStatus = true,
}: {
  fields: SchemeFormFields
  update: (key: keyof SchemeFormFields, value: string) => void
  companies: CompanyRef[]
  hideCompany?: boolean
  /** When false, status is not shown (create mode; backend defaults to active). */
  showStatus?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {!hideCompany && (
        <div className="col-span-2">
          <label htmlFor="sch-company" className="block text-sm text-[var(--foreground-muted)] mb-1">
            Company *
          </label>
          <select
            id="sch-company"
            value={fields.company_id}
            onChange={(e) => update('company_id', e.target.value)}
            required
            className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
          >
            <option value="">— Select company —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="col-span-2">
        <label htmlFor="sch-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Name *
        </label>
        <input
          id="sch-name"
          type="text"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          required
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div className="col-span-2">
        <label htmlFor="sch-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Description
        </label>
        <textarea
          id="sch-desc"
          value={fields.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
        />
      </div>
      <div>
        <label htmlFor="sch-limit" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Limit value
        </label>
        <input
          id="sch-limit"
          type="number"
          min="0"
          step="0.01"
          value={fields.limit_value}
          onChange={(e) => update('limit_value', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      {showStatus && (
        <div>
          <label htmlFor="sch-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
            Status
          </label>
          <select
            id="sch-status"
            value={fields.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
          >
            <option value="active">Active</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      )}
      <div>
        <label htmlFor="sch-begin" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Begin date
        </label>
        <input
          id="sch-begin"
          type="date"
          value={fields.begin_date}
          onChange={(e) => update('begin_date', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="sch-end" className="block text-sm text-[var(--foreground-muted)] mb-1">
          End date
        </label>
        <input
          id="sch-end"
          type="date"
          value={fields.end_date}
          onChange={(e) => update('end_date', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
    </div>
  )
}

/* ─── Create dialog ─── */

function CreateSchemeDialog({
  open,
  onOpenChange,
  companies,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyRef[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useSchemeForm()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPost<Scheme>('/schemes', body, opts),
    onSuccess: () => {
      onSuccess()
      form.reset()
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New scheme</DialogTitle>
          <DialogDescription>Fill in the details to create a scheme.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form.toPayload())
          }}
          className="space-y-4"
        >
          <SchemeFormBody fields={form.fields} update={form.update} companies={companies} showStatus={false} />
          {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !form.fields.name.trim() || !form.fields.company_id}
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Detail dialog ─── */

function SchemeDetailDialog({
  schemeId,
  open,
  onOpenChange,
  companyById,
  onEdit,
}: {
  schemeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companyById: Record<string, CompanyRef>
  onEdit: (id: string) => void
}) {
  const opts = useApi()

  const { data: scheme, isLoading } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => apiGet<Scheme>(`/schemes/${schemeId}`, opts),
    enabled: open && !!schemeId && !!opts.tenantId && !!opts.token,
  })

  const fmtDate = (d: string | null) =>
    d ? format(new Date(d), 'dd MMM yyyy') : '—'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Scheme details</DialogTitle>
          <DialogDescription>Details for the selected scheme.</DialogDescription>
        </DialogHeader>
        {isLoading || !scheme ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={scheme.name} />
            <DetailRow label="Company" value={companyById[scheme.company_id]?.name ?? scheme.company_id} />
            <DetailRow label="Description" value={scheme.description} />
            <DetailRow label="Limit" value={scheme.limit_value != null ? formatCurrency(Number(scheme.limit_value)) : null} />
            <DetailRow label="Begin date" value={fmtDate(scheme.begin_date)} />
            <DetailRow label="End date" value={fmtDate(scheme.end_date)} />
            <DetailRow label="Termination" value={fmtDate(scheme.termination_date)} />
            <dt className="text-[var(--foreground-muted)]">Status</dt>
            <dd><StatusBadge status={scheme.status} /></dd>
          </dl>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {scheme && (
            <Button onClick={() => onEdit(scheme.id)}>Edit</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <>
      <dt className="text-[var(--foreground-muted)]">{label}</dt>
      <dd className="text-[var(--foreground)]">{value || '—'}</dd>
    </>
  )
}

/* ─── Edit dialog ─── */

function EditSchemeDialog({
  schemeId,
  open,
  onOpenChange,
  companies,
  onSuccess,
}: {
  schemeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyRef[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useSchemeForm()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: scheme } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => apiGet<Scheme>(`/schemes/${schemeId}`, opts),
    enabled: open && !!schemeId && !!opts.tenantId && !!opts.token,
  })

  if (scheme && !loaded) {
    form.reset({
      company_id: scheme.company_id,
      name: scheme.name,
      description: scheme.description ?? '',
      limit_value: scheme.limit_value != null ? String(scheme.limit_value) : '',
      begin_date: scheme.begin_date ?? '',
      end_date: scheme.end_date ?? '',
      status: scheme.status,
    })
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPatch<Scheme>(`/schemes/${schemeId}`, body, opts),
    onSuccess: () => {
      onSuccess()
      setLoaded(false)
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setLoaded(false)
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit scheme</DialogTitle>
          <DialogDescription>Update scheme information.</DialogDescription>
        </DialogHeader>
        {!scheme ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate(form.toPayload())
            }}
            className="space-y-4"
          >
            <SchemeFormBody
              fields={form.fields}
              update={form.update}
              companies={companies}
              hideCompany
            />
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !form.fields.name.trim()}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
