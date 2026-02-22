import { createFileRoute, Link } from '@tanstack/react-router'
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
import { ListPagePagination, TableSkeleton } from '#/components/list-page'
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
} from 'lucide-react'
import { CreateCompanyDialog, EditCompanyDialog } from './companies'

interface Company {
  id: string
  tenant_id: string
  name: string
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

interface CompanyType {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

const LIMIT = 20

function CompanyTableSkeleton() {
  return <TableSkeleton columns={7} withCheckbox rows={5} />
}

export const Route = createFileRoute('/companies/')({
  component: CompaniesListPage,
})

function CompaniesListPage() {
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
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Building2 className="size-3.5" aria-hidden />
                      </span>
                      Name
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <User className="size-3.5" aria-hidden />
                      </span>
                      Contact
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Mail className="size-3.5" aria-hidden />
                      </span>
                      Email
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Phone className="size-3.5" aria-hidden />
                      </span>
                      Phone
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Layers className="size-3.5" aria-hidden />
                      </span>
                      Type
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Globe className="size-3.5" aria-hidden />
                      </span>
                      Website
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 w-[12rem] font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <SquareArrowOutUpRight className="size-3.5" aria-hidden />
                      </span>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((company) => (
                  <tr
                    key={company.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      selectedIds.has(company.id) ? 'bg-[var(--muted)]/40' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <Checkbox
                        checked={selectedIds.has(company.id)}
                        onCheckedChange={() => toggleOne(company.id)}
                        aria-label={`Select ${company.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {company.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.contact_person ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.email ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.phone ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.company_type != null
                        ? companyTypeById[String(company.company_type)]?.name ?? '—'
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.website ? (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[var(--primary)] hover:underline truncate max-w-[130px]"
                        >
                          <Globe className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
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

          <ListPagePagination
            skip={skip}
            limit={LIMIT}
            currentPageSize={items.length}
            onPrevious={() => setSkip((s) => Math.max(0, s - LIMIT))}
            onNext={() => items.length === LIMIT && setSkip((s) => s + LIMIT)}
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
