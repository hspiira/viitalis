import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { apiGet, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import { ListPagePagination, TableSkeleton } from '#/components/list-page'
import { Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import {
  Users,
  Search,
  Building2,
  UserPlus,
  Filter,
} from 'lucide-react'

export const Route = createFileRoute('/members')({
  beforeLoad: () => requireAuthBeforeLoad('/members'),
  component: MembersPage,
})

interface Member {
  id: string
  tenant_id: string
  company_id: string
  scheme_id: string
  card_no: string
  name: string
  dob: string | null
  status: string
}

const LIMIT = 20

function MembersPage() {
  const opts = useApi()
  const [companyFilter, setCompanyFilter] = useState('')
  const [schemeFilter, setSchemeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })
  if (companyFilter) params.set('company_id', companyFilter)
  if (schemeFilter) params.set('scheme_id', schemeFilter)

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members', skip, LIMIT, companyFilter, schemeFilter, opts.tenantId],
    queryFn: () => apiGet<Member[]>(`/members?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/companies', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: schemes = [] } = useQuery({
    queryKey: ['schemes-list', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>(`/schemes?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const companyById = useMemo(() => buildIdToEntityMap(companies as { id: string; name: string }[]), [companies])
  const schemeById = useMemo(() => buildIdToEntityMap(schemes as { id: string; name: string }[]), [schemes])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.trim().toLowerCase()
    return items.filter(
      (m) =>
        m.card_no.toLowerCase().includes(q) ||
        (m.name || '').toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Members
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage members.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <header className="space-y-0.5">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Members</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-sm text-[var(--foreground-muted)]">
          Manage members and their coverage.
        </p>
      </header>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex h-9 min-w-[200px] max-w-[280px] flex-1 items-center gap-2 rounded-md border border-[var(--input)] bg-[var(--background)] px-3">
            <Search className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <input
              type="search"
              placeholder="Search by name or card no"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
              aria-label="Search members"
            />
          </div>
          <div className="flex h-9 min-w-[160px] items-center gap-2 rounded-md border border-[var(--input)] bg-[var(--background)] px-3">
            <Building2 className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
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
          <div className="flex h-9 min-w-[160px] items-center gap-2 rounded-md border border-[var(--input)] bg-[var(--background)] px-3">
            <Filter className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <select
              value={schemeFilter}
              onChange={(e) => {
                setSchemeFilter(e.target.value)
                setSkip(0)
              }}
              className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
              aria-label="Scheme"
            >
              <option value="">All schemes</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="ml-auto h-9 bg-[var(--primary)] px-4 text-[var(--primary-foreground)]"
          >
            <UserPlus className="size-4 mr-1.5" aria-hidden />
            New member
          </Button>
        </div>

        {error && (
          <div className="flex flex-col gap-2">
            <p className="text-[var(--destructive)]">
              {getApiErrorDetail(error as { detail?: string })}
            </p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton columns={7} rows={5} />
        ) : filteredItems.length === 0 ? (
          <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No members</EmptyTitle>
              <EmptyDescription>
                No members match your filters. Try changing the filters or add a new member.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="secondary"
                onClick={() => {
                  setCompanyFilter('')
                  setSchemeFilter('')
                  setSearchQuery('')
                  setSkip(0)
                  refetch()
                }}
              >
                Clear filters
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                New member
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="text-left py-2 px-3 font-medium">Member</th>
                    <th className="text-left py-2 px-3 font-medium">Card no</th>
                    <th className="text-left py-2 px-3 font-medium">Company</th>
                    <th className="text-left py-2 px-3 font-medium">Scheme</th>
                    <th className="text-right py-2 px-3 font-medium">DOB</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((member) => (
                    <tr
                      key={member.id}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                    >
                      <td className="py-2 px-3 font-medium">{member.name || '—'}</td>
                      <td className="py-2 px-3 font-mono text-[var(--foreground-muted)]">{member.card_no}</td>
                      <td className="max-w-[200px] truncate py-2 px-3" title={companyById[member.company_id]?.name ?? member.company_id}>
                        {companyById[member.company_id]?.name ?? member.company_id}
                      </td>
                      <td className="max-w-[200px] truncate py-2 px-3" title={schemeById[member.scheme_id]?.name ?? member.scheme_id}>
                        {schemeById[member.scheme_id]?.name ?? member.scheme_id}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {member.dob ? format(new Date(member.dob), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium capitalize ${
                            (member.status || '').toLowerCase() === 'active'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : 'bg-[var(--muted)] text-[var(--foreground-muted)]'
                          }`}
                        >
                          {member.status || '—'}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/claims" search={{ member_id: member.id }}>
                            View claims
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ListPagePagination
              skip={skip}
              limit={LIMIT}
              currentPageSize={items.length}
              onPrevious={() => setSkip((s) => Math.max(0, s - LIMIT))}
              onNext={() => items.length === LIMIT && setSkip((s) => s + LIMIT)}
            />
          </>
        )}
      </section>

      {showCreate && (
        <p className="text-sm text-[var(--foreground-muted)]">
          New member form — coming soon.
        </p>
      )}
    </div>
  )
}
