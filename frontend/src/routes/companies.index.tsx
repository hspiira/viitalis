import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { apiGet, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap } from '#/lib/utils'
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
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  MoreVertical,
  Globe,
  Trash2,
  User,
  Mail,
  Phone,
  Layers,
  SquareArrowOutUpRight,
  SquarePen,
  Ban,
  PauseCircle,
  Archive,
  CircleDot,
} from 'lucide-react'
import { CreateCompanyDialog, EditCompanyDialog } from './companies'

interface Company {
  id: string
  tenant_id: string
  name: string
  status: string
  contact_person: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  remarks: string | null
  location: string | null
  district_id: number | null
  company_type: number | null
}

const TABLE_CELL = 'py-1.5 px-3'
const TABLE_CELL_TRUNCATE = `min-w-0 ${TABLE_CELL} overflow-hidden`

function StatusBadge({ status }: { status: string }) {
  const normalized = (status || '').toLowerCase()
  const isActive = normalized === 'active'
  const variant = isActive
    ? 'bg-[var(--icon-success)]/15 text-[var(--icon-success)]'
    : 'bg-[var(--muted)] text-[var(--foreground-muted)]'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${variant}`}
      title={status}
    >
      <span className={`size-1.5 rounded-full ${isActive ? 'bg-[var(--icon-success)]' : 'bg-current'}`} aria-hidden />
      {status || '—'}
    </span>
  )
}

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

function TruncateCell({
  value,
  fallback = '—',
}: {
  value: string | null
  fallback?: string
}) {
  const display = value ?? fallback
  return (
    <td className={`${TABLE_CELL_TRUNCATE} text-[var(--foreground-muted)]`}>
      <span className="block truncate" title={value ?? undefined}>
        {display}
      </span>
    </td>
  )
}

interface CompanyType {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

const LIMIT = 20

function CompanyTableSkeleton() {
  return <TableSkeleton columns={8} withCheckbox rows={5} />
}

export const Route = createFileRoute('/companies/')({
  component: CompaniesListPage,
})

function CompaniesListPage() {
  const navigate = useNavigate()
  const opts = useApi()
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null)
  const [openActionsCompanyId, setOpenActionsCompanyId] = useState<string | null>(null)
  const { selectedIds, toggleAll, toggleOne, clearSelection } = useRowSelection()

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<Company[]>(`/companies?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: companyTypes = [] } = useQuery({
    queryKey: ['company-types', opts.tenantId],
    queryFn: () => apiGet<CompanyType[]>('/company-types?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const companyTypeById = useMemo(
    () => buildIdToEntityMap(companyTypes),
    [companyTypes],
  )

  const filteredItems = useMemo(() => {
    let result = items
    if (typeFilter) {
      result = result.filter((c) => String(c.company_type) === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.contact_person || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [items, typeFilter, searchQuery])

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Companies</h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage companies.
        </p>
      </div>
    )
  }

  const itemIds = useMemo(() => filteredItems.map((c) => c.id), [filteredItems])
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
            placeholder="Search companies"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search companies"
          />
        </div>
        <div className="flex h-8 w-[150px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Filter className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Company type"
          >
            <option value="">All types</option>
            {companyTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
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
            Add company
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
        <CompanyTableSkeleton />
      ) : filteredItems.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No companies</EmptyTitle>
            <EmptyDescription>
              No companies match your filters. Try changing the filters or add a new company.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              onClick={() => {
                setTypeFilter('')
                setSearchQuery('')
                setSkip(0)
                refetch()
              }}
            >
              Clear filters
            </Button>
            <Button onClick={() => setShowCreate(true)}>Add company</Button>
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
                  <TableTh icon={Building2}>Name</TableTh>
                  <TableTh icon={CircleDot} className="w-[7%]">Status</TableTh>
                  <TableTh icon={User} className="w-[12%]">Contact</TableTh>
                  <TableTh icon={Mail} className="w-[14%]">Email</TableTh>
                  <TableTh icon={Phone} className="w-[11%]">Phone</TableTh>
                  <TableTh icon={Layers} className="w-[8%]">Type</TableTh>
                  <TableTh icon={Globe} className="w-[11%]">Website</TableTh>
                  <TableTh icon={SquareArrowOutUpRight} className="w-24">Actions</TableTh>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((company, index) => (
                  <tr
                    key={company.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      index % 2 === 0 ? 'bg-[var(--muted)]/10' : ''
                    } ${selectedIds.has(company.id) ? '!bg-[var(--muted)]/40' : ''}`}
                  >
                    <td className={`${TABLE_CELL} pl-3 pr-2`}>
                      <Checkbox
                        checked={selectedIds.has(company.id)}
                        onCheckedChange={() => toggleOne(company.id)}
                        aria-label={`Select ${company.name}`}
                      />
                    </td>
                    <td className={`${TABLE_CELL_TRUNCATE} font-medium text-[var(--foreground)]`}>
                      <span
                        role="button"
                        tabIndex={0}
                        className="block truncate cursor-pointer hover:underline focus:outline-none focus:underline"
                        title={company.name}
                        onDoubleClick={() => navigate({ to: '/companies/$companyId', params: { companyId: company.id } })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            navigate({ to: '/companies/$companyId', params: { companyId: company.id } })
                          }
                        }}
                      >
                        {company.name}
                      </span>
                    </td>
                    <td className={TABLE_CELL}>
                      <StatusBadge status={company.status} />
                    </td>
                    <TruncateCell value={company.contact_person} />
                    <TruncateCell value={company.email} />
                    <TruncateCell value={company.phone} />
                    <td className={`${TABLE_CELL} text-[var(--foreground-muted)]`}>
                      {company.company_type != null
                        ? companyTypeById[String(company.company_type)]?.name ?? '—'
                        : '—'}
                    </td>
                    <td className={`${TABLE_CELL_TRUNCATE} text-[var(--foreground-muted)]`}>
                      {company.website ? (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex min-w-0 items-center gap-1 text-[var(--primary)] hover:underline"
                          title={company.website}
                        >
                          <Globe className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={TABLE_CELL}>
                      <div className="relative flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-[var(--primary)] hover:opacity-80"
                          title="View"
                          aria-label="View company"
                          asChild
                        >
                          <Link to="/companies/$companyId" params={{ companyId: company.id }}>
                            <SquareArrowOutUpRight className="size-4" aria-hidden />
                          </Link>
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-[var(--icon-muted)] hover:opacity-80"
                            onClick={() =>
                              setOpenActionsCompanyId((id) => (id === company.id ? null : company.id))
                            }
                            title="More actions"
                            aria-label="More actions"
                            aria-expanded={openActionsCompanyId === company.id}
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                          {openActionsCompanyId === company.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                aria-hidden
                                onClick={() => setOpenActionsCompanyId(null)}
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
                                    setEditCompanyId(company.id)
                                    setOpenActionsCompanyId(null)
                                  }}
                                >
                                  <SquarePen className="size-3.5 shrink-0 text-[var(--icon-primary)]" aria-hidden />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  role="menuitem"
                                  onClick={() => setOpenActionsCompanyId(null)}
                                >
                                  <Ban className="size-3.5 shrink-0 text-[var(--icon-destructive)]" aria-hidden />
                                  Terminate
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  role="menuitem"
                                  onClick={() => setOpenActionsCompanyId(null)}
                                >
                                  <PauseCircle className="size-3.5 shrink-0 text-[var(--icon-warning)]" aria-hidden />
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  role="menuitem"
                                  onClick={() => setOpenActionsCompanyId(null)}
                                >
                                  <Archive className="size-3.5 shrink-0 text-[var(--icon-muted)]" aria-hidden />
                                  Archive
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
                {selectedIds.size} compan{selectedIds.size !== 1 ? 'ies' : 'y'} selected
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

      <CreateCompanyDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        companyTypes={companyTypes}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['companies'] })
        }}
      />

      <EditCompanyDialog
        companyId={editCompanyId ?? ''}
        open={!!editCompanyId}
        onOpenChange={(open) => !open && setEditCompanyId(null)}
        companyTypes={companyTypes}
        onSuccess={() => {
          setEditCompanyId(null)
          queryClient.invalidateQueries({ queryKey: ['companies'] })
          queryClient.invalidateQueries({ queryKey: ['company'] })
        }}
      />
    </div>
  )
}
