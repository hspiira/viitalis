import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { apiGet, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap, formatCurrency } from '#/lib/utils'
import { useRowSelection, isAllSelected } from '#/hooks/use-row-selection'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import { TablePagination, TableSkeleton } from '#/components/list-page'
import {
  Shield,
  Search,
  Filter,
  Building2,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  MoreVertical,
  SquareArrowOutUpRight,
  SquarePen,
  Trash2,
  Calendar,
  Coins,
} from 'lucide-react'
import { CreateSchemeDialog, EditSchemeDialog, StatusBadge, type Scheme, type CompanyRef } from './schemes'

const LIMIT = 20
const TABLE_CELL = 'py-1.5 px-3'
const TABLE_CELL_TRUNCATE = `min-w-0 ${TABLE_CELL} overflow-hidden`

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'terminated', label: 'Terminated' },
]

function TableTh({
  icon: Icon,
  children,
  className = '',
}: {
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <th className={`text-left font-medium text-[var(--foreground-muted)] ${TABLE_CELL} ${className}`}>
      <span className="inline-flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
          <Icon className="size-3.5" aria-hidden />
        </span>
        {children}
      </span>
    </th>
  )
}

function SchemeTableSkeleton() {
  return <TableSkeleton columns={7} withCheckbox rows={5} />
}

export const Route = createFileRoute('/schemes/')({
  component: SchemesListPage,
})

function SchemesListPage() {
  const navigate = useNavigate()
  const opts = useApi()
  const queryClient = useQueryClient()
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editSchemeId, setEditSchemeId] = useState<string | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)
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
          <div className="rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="w-10 py-1.5 pl-3 pr-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleToggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <TableTh icon={Shield}>Name</TableTh>
                  <TableTh icon={Building2} className="w-[14%]">Company</TableTh>
                  <TableTh icon={Coins} className="w-[10%]">Limit</TableTh>
                  <TableTh icon={Calendar} className="w-[18%]">Period</TableTh>
                  <TableTh icon={Filter} className="w-[10%]">Status</TableTh>
                  <TableTh icon={SquareArrowOutUpRight} className="w-24">Actions</TableTh>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((scheme, index) => (
                  <tr
                    key={scheme.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      index % 2 === 0 ? 'bg-[var(--muted)]/10' : ''
                    } ${selectedIds.has(scheme.id) ? '!bg-[var(--muted)]/40' : ''}`}
                  >
                    <td className={`${TABLE_CELL} pl-3 pr-2`}>
                      <Checkbox
                        checked={selectedIds.has(scheme.id)}
                        onCheckedChange={() => toggleOne(scheme.id)}
                        aria-label={`Select ${scheme.name}`}
                      />
                    </td>
                    <td className={`${TABLE_CELL_TRUNCATE} font-medium text-[var(--foreground)]`}>
                      <span
                        role="button"
                        tabIndex={0}
                        className="block truncate cursor-pointer hover:underline focus:outline-none focus:underline"
                        title={scheme.name}
                        onDoubleClick={() => navigate({ to: '/schemes/$schemeId', params: { schemeId: scheme.id } })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate({ to: '/schemes/$schemeId', params: { schemeId: scheme.id } })
                          }
                        }}
                      >
                        {scheme.name}
                      </span>
                    </td>
                    <td className={`${TABLE_CELL} text-[var(--foreground-muted)]`}>
                      <span className="block truncate" title={companyById[scheme.company_id]?.name ?? scheme.company_id}>
                        {companyById[scheme.company_id]?.name ?? scheme.company_id}
                      </span>
                    </td>
                    <td className={`${TABLE_CELL} text-right tabular-nums text-[var(--foreground-muted)]`}>
                      {scheme.limit_value != null
                        ? formatCurrency(Number(scheme.limit_value))
                        : '—'}
                    </td>
                    <td className={`${TABLE_CELL} text-[var(--foreground-muted)] text-xs`}>
                      {scheme.begin_date || scheme.end_date
                        ? `${scheme.begin_date ? format(new Date(scheme.begin_date), 'dd MMM yyyy') : '—'} – ${scheme.end_date ? format(new Date(scheme.end_date), 'dd MMM yyyy') : '—'}`
                        : '—'}
                    </td>
                    <td className={TABLE_CELL}>
                      <StatusBadge status={scheme.status} />
                    </td>
                    <td className={TABLE_CELL}>
                      <div className="relative flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-[var(--primary)] hover:opacity-80"
                          title="View"
                          aria-label="View scheme"
                          asChild
                        >
                          <Link to="/schemes/$schemeId" params={{ schemeId: scheme.id }}>
                            <SquareArrowOutUpRight className="size-4" aria-hidden />
                          </Link>
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-[var(--icon-muted)] hover:opacity-80"
                            onClick={() =>
                              setOpenActionsId((id) => (id === scheme.id ? null : scheme.id))
                            }
                            title="More actions"
                            aria-label="More actions"
                            aria-expanded={openActionsId === scheme.id}
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                          {openActionsId === scheme.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                aria-hidden
                                onClick={() => setOpenActionsId(null)}
                              />
                              <div
                                className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
                                role="menu"
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  role="menuitem"
                                  onClick={() => {
                                    setEditSchemeId(scheme.id)
                                    setOpenActionsId(null)
                                  }}
                                >
                                  <SquarePen className="size-3.5 shrink-0 text-[var(--icon-primary)]" aria-hidden />
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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

          <TablePagination
            skip={skip}
            limit={LIMIT}
            currentPageSize={items.length}
            onSkipChange={setSkip}
          />
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
