import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import { apiGet } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '#/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import {
  Building2,
  Mail,
  MapPin,
  Users,
  ScrollText,
  BarChart3,
  SquarePen,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Zap,
  Send,
  Shield,
  Award,
} from 'lucide-react'
import { EditCompanyDialog } from './companies'

type CompanyDetailTab = 'details' | 'branches' | 'members' | 'contracts' | 'schemes' | 'analytics'

const TAB_IDS: CompanyDetailTab[] = ['details', 'branches', 'members', 'contracts', 'schemes', 'analytics']

export const Route = createFileRoute('/companies/$companyId')({
  beforeLoad: () => requireAuthBeforeLoad('/companies/$companyId'),
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      typeof search.tab === 'string' && TAB_IDS.includes(search.tab as CompanyDetailTab)
        ? (search.tab as CompanyDetailTab)
        : ('details' as CompanyDetailTab),
  }),
  component: CompanyDetailPage,
})

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

interface CompanyBranch {
  id: string
  tenant_id: string
  company_id: string
  name: string
  address: string | null
  phone: string | null
}

interface CompanyMember {
  id: string
  tenant_id: string
  company_id: string
  scheme_id: string
  card_no: string
  name: string
  dob: string | null
  status: string
}

interface MemberDependant {
  id: string
  tenant_id: string
  member_id: string
  name: string
  card_no: string | null
  dob: string | null
}

interface CompanyScheme {
  id: string
  tenant_id: string
  company_id: string
  name: string
  status: string
}

interface CompanySummaryRow {
  company_id: string
  company_name: string
  member_count: number
  claim_count: number
  total_amount: number | string
}

const COMPANY_DETAIL_TABS: {
  id: CompanyDetailTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'details', label: 'Overview', icon: Building2 },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'members', label: 'Members & dependants', icon: Users },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
  { id: 'schemes', label: 'Schemes', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function TableSectionSkeleton({ cols = 3, rows = 5 }: { cols?: number; rows?: number }) {
  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="py-2 pr-4 text-left">
                <Skeleton className="h-4 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-[var(--border-subtle)]">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-2.5 pr-4">
                  <Skeleton className="h-4 w-full max-w-[10rem]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AnalyticsSectionSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

function CompanyDetailPage() {
  const { companyId } = Route.useParams()
  const { tab: activeTab } = Route.useSearch()
  const opts = useApi()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null)

  const { data: company, isLoading: companyLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => apiGet<Company>(`/companies/${companyId}`, opts),
    enabled: !!companyId && !!opts.tenantId && !!opts.token,
  })

  const { data: companyTypes = [] } = useQuery({
    queryKey: ['company-types', opts.tenantId],
    queryFn: () => apiGet<CompanyType[]>('/company-types?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['companies', companyId, 'branches'],
    queryFn: () => apiGet<CompanyBranch[]>(`/companies/${companyId}/branches?skip=0&limit=500`, opts),
    enabled: !!companyId && activeTab === 'branches' && !!opts.tenantId && !!opts.token,
  })

  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['members', companyId],
    queryFn: () => apiGet<CompanyMember[]>(`/members?company_id=${companyId}&skip=0&limit=500`, opts),
    enabled: !!companyId && activeTab === 'members' && !!opts.tenantId && !!opts.token,
  })

  const { data: expandedDependants = [] } = useQuery({
    queryKey: ['members', expandedMemberId, 'dependants'],
    queryFn: () =>
      apiGet<MemberDependant[]>(
        `/members/${expandedMemberId}/dependants?skip=0&limit=500`,
        opts
      ),
    enabled: !!expandedMemberId && !!opts.tenantId && !!opts.token,
  })

  const { data: schemes = [], isLoading: schemesLoading } = useQuery({
    queryKey: ['schemes', companyId],
    queryFn: () => apiGet<CompanyScheme[]>(`/schemes?company_id=${companyId}&skip=0&limit=500`, opts),
    enabled:
      !!companyId &&
      (activeTab === 'contracts' || activeTab === 'details' || activeTab === 'schemes') &&
      !!opts.tenantId &&
      !!opts.token,
  })

  const { data: summaryRows = [], isLoading: summaryLoading } = useQuery({
    queryKey: ['reports', 'company-summary', companyId],
    queryFn: () =>
      apiGet<CompanySummaryRow[]>(`/reports/company-summary?company_id=${companyId}&limit=1`, opts),
    enabled:
      !!companyId &&
      (activeTab === 'analytics' || activeTab === 'details') &&
      !!opts.tenantId &&
      !!opts.token,
  })
  const summary = summaryRows[0]

  const currentTabLabel =
    COMPANY_DETAIL_TABS.find((t) => t.id === activeTab)?.label ?? 'Company details'
  const companyDisplayName = companyLoading || !company ? '…' : company.name
  const pageTitle = companyLoading || !company ? 'Company' : company.name

  return (
    <div className="flex flex-col gap-0 min-h-0">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--muted)]/40 px-0 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/companies" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              <ArrowLeft className="size-5" aria-label="Back to companies" />
            </Link>
          </Button>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Building2 className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-[var(--foreground)]">{pageTitle}</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              View details, branches, members, contracts, schemes and analytics.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {company && (
            <Button onClick={() => setEditOpen(true)}>
              <SquarePen className="size-4 mr-1.5" aria-hidden />
              Edit company
            </Button>
          )}
        </div>
      </header>

      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--muted)]/20 px-0">
        {COMPANY_DETAIL_TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to="/companies/$companyId"
            params={{ companyId }}
            search={{ tab: id }}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      <Breadcrumb className="shrink-0 px-0 py-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/companies" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                Companies
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/companies/$companyId" params={{ companyId }} search={{ tab: 'details' }}>
                {companyDisplayName}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{currentTabLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="min-h-0 flex-1 overflow-y-auto px-0 py-5">
        {activeTab === 'details' && (
          <>
            {companyLoading || !company ? (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-64 rounded-xl" />
                </div>
                <Skeleton className="min-h-[320px] rounded-xl" />
                <Skeleton className="min-h-[320px] rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:h-full lg:min-h-[75vh] lg:grid-rows-[1fr_1fr_1fr] lg:items-stretch">
                {/* Row 1, Col 1: Company profile + tabs + list (single card) */}
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5 lg:row-start-1 lg:col-start-1 lg:h-full">
                  <div className="flex shrink-0 flex-col items-center text-center">
                    <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--border)] bg-[var(--primary)]/10 text-[var(--icon-primary)]">
                      <Building2 className="size-8" aria-hidden />
                      <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[var(--card)] bg-[var(--icon-success)]" aria-hidden />
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">{company.name}</h3>
                    <a
                      href={company.email ? `mailto:${company.email}` : undefined}
                      className="mt-1 flex items-center justify-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    >
                      <Mail className="size-3.5 shrink-0" aria-hidden />
                      {company.email || '—'}
                    </a>
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-[var(--foreground-muted)]">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {[company.address, company.location].filter(Boolean).join(', ') || '—'}
                    </p>
                    <div className="mt-4 flex w-full flex-wrap items-center justify-center gap-3 border-b border-[var(--border-subtle)] pb-3">
                      <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-1.5">
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Lives (active)</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--foreground)]">{summary ? summary.member_count : '—'}</p>
                      </div>
                      <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-1.5">
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Schemes</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--foreground)]">{!schemesLoading ? schemes.length : '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 1, Col 2: Banner + Performance (two cards stacked) */}
                <div className="flex min-h-0 flex-col gap-4 lg:row-start-1 lg:col-start-2 lg:h-full">
                  <div className="flex shrink-0 items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--primary)]/5 px-4 py-3">
                    <Send className="size-5 shrink-0 text-[var(--primary)]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--foreground)]">View claims by scheme and period.</p>
                      <p className="text-xs text-[var(--foreground-muted)]">Filter and export from the Claims page.</p>
                    </div>
                    <a href="/claims" className="shrink-0 text-xs font-medium text-[var(--primary)] hover:underline">Get started</a>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5">
                    <div className="flex shrink-0 items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Performance</h3>
                        <p className="text-xs text-[var(--foreground-muted)]">Claims · From last 7 days</p>
                      </div>
                      <Link
                        to="/companies/$companyId"
                        params={{ companyId }}
                        search={{ tab: 'analytics' }}
                        className="shrink-0 text-xs font-medium text-[var(--primary)] hover:underline flex items-center gap-0.5"
                      >
                        More analysis
                        <ChevronRight className="size-3.5" aria-hidden />
                      </Link>
                    </div>
                    {/* Main chart + stats: scrollable */}
                    <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                    <div className="min-h-[180px] w-full">
                      <ChartContainer
                        config={{
                          claims: { label: 'Claims', color: 'var(--primary)' },
                          amount: { label: 'Amount', color: 'hsl(210, 45%, 52%)' },
                        } satisfies ChartConfig}
                        className="h-full w-full min-h-[200px]"
                      >
                        <BarChart
                          data={[
                            { day: 'Mon', claims: 18, amount: 22400 },
                            { day: 'Tue', claims: 22, amount: 28100 },
                            { day: 'Wed', claims: 15, amount: 19200 },
                            { day: 'Thu', claims: 28, amount: 35100 },
                            { day: 'Fri', claims: 24, amount: 29800 },
                            { day: 'Sat', claims: 12, amount: 14500 },
                            { day: 'Sun', claims: 5, amount: 6200 },
                          ]}
                          margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                        >
                          <XAxis dataKey="day" tick={{ fill: 'var(--foreground-muted)' }} />
                          <YAxis tick={{ fill: 'var(--foreground-muted)' }} />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="claims" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                    {/* Summary stats */}
                    <div className="mt-4 flex flex-wrap gap-4 border-t border-[var(--border-subtle)] pt-4">
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Submitted</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--foreground)]">100%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Approved</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--icon-success)]">78%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Pending</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--icon-warning)]">15%</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">Rejected</p>
                        <p className="text-lg font-bold tabular-nums text-[var(--icon-destructive)]">7%</p>
                      </div>
                    </div>
                    {/* Detailed metrics with trends */}
                    <div className="mt-4 space-y-2">
                      {[
                        { label: 'Approved', value: '78.0%', change: '+2.1%', up: true, positiveIsGood: true },
                        { label: 'Pending', value: '15.2%', change: '-0.5%', up: false, positiveIsGood: false },
                        { label: 'Rejected', value: '6.8%', change: '+0.3%', up: true, positiveIsGood: false },
                        { label: 'Avg. turnaround', value: '2.4 days', change: '-0.2', up: false, positiveIsGood: false },
                        { label: 'Total amount', value: '$153.2k', change: '+5.1%', up: true, positiveIsGood: true },
                      ].map((m) => {
                        const good = m.up === m.positiveIsGood
                        return (
                          <div
                            key={m.label}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-[var(--foreground-muted)]">{m.label}</span>
                            <span className="flex items-center gap-1.5 tabular-nums">
                              <span className="font-medium text-[var(--foreground)]">{m.value}</span>
                              <span
                                className="flex items-center text-xs"
                                style={{ color: good ? 'var(--icon-success)' : 'var(--icon-destructive)' }}
                              >
                                {m.up ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                                {m.change}
                              </span>
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    </div>
                  </div>
                </div>

                {/* Row 1, Col 3: Claims overview + Leaderboard (two cards stacked) */}
                <div className="flex min-h-0 flex-col gap-4 lg:row-start-1 lg:col-start-3 lg:h-full">
                  <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5">
                    <div className="flex shrink-0 items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[var(--foreground)]">Claims overview</h3>
                      <button type="button" className="rounded p-1 text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]" aria-label="More options">
                        <MoreVertical className="size-4" aria-hidden />
                      </button>
                    </div>
                    <div className="mt-3 flex items-start gap-3 rounded-lg bg-[var(--primary)]/5 p-3">
                      <Send className="size-4 shrink-0 text-[var(--primary)]" aria-hidden />
                      <p className="text-xs text-[var(--foreground)]">
                        Snapshot of claim volumes and outcomes across all schemes for this company.
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {[
                        { label: 'Submitted', value: '100%', period: 'Last 24 hours', color: 'var(--icon-success)', progress: 100 },
                        { label: 'Approved', value: '78%', period: 'Last 30 days', color: 'var(--icon-success)', progress: 78 },
                        { label: 'Pending', value: '15%', period: 'Last 30 days', color: 'var(--icon-warning)', progress: 15 },
                        { label: 'Rejected', value: '7%', period: 'Last 30 days', color: 'var(--icon-destructive)', progress: 7 },
                      ].map((m) => (
                        <div key={m.label} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--muted)]/30 p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: m.color }} aria-hidden />
                            <span className="text-xs font-medium text-[var(--foreground-muted)]">{m.label}</span>
                          </div>
                          <p className="mt-1 text-lg font-bold tabular-nums text-[var(--foreground)]">{m.value}</p>
                          <p className="text-xs text-[var(--foreground-muted)]">{m.period}</p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                            <div className="h-full rounded-full transition-all" style={{ width: `${m.progress}%`, backgroundColor: m.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5">
                    <div className="flex shrink-0 items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Zap className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                        <h3 className="text-sm font-semibold text-[var(--foreground)]">Leaderboard</h3>
                      </div>
                      <button type="button" className="rounded-md bg-[var(--primary)] px-3 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90">All schemes</button>
                    </div>
                    <div className="mt-2 flex shrink-0 gap-3 text-xs">
                      <span className="font-medium text-[var(--foreground)]">Claims</span>
                      <span className="text-[var(--foreground-muted)]">From last 7 days</span>
                    </div>
                    <ul className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto">
                      {[
                        { rank: 1, title: 'Most claims', subtitle: 'Core health scheme', count: 42, unit: 'Claims', handle: 'Core Health' },
                        { rank: 2, title: 'Dental plus', subtitle: null, count: 28, unit: 'Claims', handle: 'Dental Plus' },
                        { rank: 3, title: 'Vision care', subtitle: null, count: 18, unit: 'Claims', handle: 'Vision Care' },
                      ].map((item) => (
                        <li key={item.rank} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] p-3 hover:bg-[var(--muted)]/20">
                          <span className="shrink-0 text-sm font-medium text-[var(--foreground-muted)]">#{item.rank}</span>
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                            {item.rank === 1 ? <Shield className="size-4" aria-hidden /> : <Award className="size-4" aria-hidden />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--foreground)]">{item.title}</p>
                            {item.subtitle && <p className="text-xs text-[var(--foreground-muted)]">{item.subtitle}</p>}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{item.count} ({item.unit})</p>
                            <p className="text-xs text-[var(--foreground-muted)]">@{item.handle.replace(/\s+/g, '').toLowerCase()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Row 2, Col 1: Delivery */}
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5 lg:row-start-2 lg:col-start-1 lg:h-full">
                  <div className="shrink-0">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Delivery</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Claims · From last 7 days</p>
                  </div>
                  <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-2">
                      <p className="text-xs font-medium text-[var(--foreground-muted)]">Total claims</p>
                      <p className="text-lg font-bold tabular-nums text-[var(--foreground)]">124</p>
                    </div>
                    <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-2">
                      <p className="text-xs font-medium text-[var(--foreground-muted)]">Approved</p>
                      <p className="text-lg font-bold tabular-nums text-[var(--icon-success)]">78%</p>
                    </div>
                    <div className="rounded-lg bg-[var(--muted)]/50 px-3 py-2">
                      <p className="text-xs font-medium text-[var(--foreground-muted)]">Avg amount</p>
                      <p className="text-lg font-bold tabular-nums text-[var(--foreground)]">$1.2k</p>
                    </div>
                  </div>
                  <div className="mt-4 min-h-[180px] w-full">
                    <ChartContainer
                      config={{
                        claims: { label: 'Claims', color: 'var(--primary)' },
                      } satisfies ChartConfig}
                      className="h-full w-full"
                    >
                      <BarChart
                        data={[
                          { day: 'Mon', claims: 18 },
                          { day: 'Tue', claims: 22 },
                          { day: 'Wed', claims: 15 },
                          { day: 'Thu', claims: 28 },
                          { day: 'Fri', claims: 24 },
                          { day: 'Sat', claims: 12 },
                          { day: 'Sun', claims: 5 },
                        ]}
                        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                      >
                        <XAxis dataKey="day" tick={{ fill: 'var(--foreground-muted)' }} />
                        <YAxis tick={{ fill: 'var(--foreground-muted)' }} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="claims" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                  </div>
                </div>

                {/* Row 2, Col 2: (empty) */}
                {/* Row 2, Col 3: (empty) */}

                {/* Row 3, Col 1: (empty) */}

                {/* Row 3, Col 2+3: Journey Metrics (single component spanning 2 columns) */}
                <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-transparent p-5 lg:row-start-3 lg:col-start-2 lg:col-span-2 lg:h-full">
                  <div className="flex shrink-0 items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">Journey Metrics</h3>
                    <span className="text-xs text-[var(--foreground-muted)]">Jul 15, 2024</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                    {[
                      { label: 'Submitted', value: '100.0%' },
                      { label: 'Approved', value: '30.6%' },
                      { label: 'Pending', value: '2.4%' },
                      { label: 'Click to open', value: '4.3%' },
                      { label: 'Rejected', value: '1.5%' },
                    ].map((m) => (
                      <div key={m.label}>
                        <p className="text-xs font-medium text-[var(--foreground-muted)]">{m.label}</p>
                        <p className="mt-0.5 text-lg font-bold tabular-nums text-[var(--foreground)]">{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 h-20 w-full">
                    <ChartContainer
                      config={{
                        volume: { label: 'Volume', color: 'hsl(166, 45%, 45%)' },
                      } satisfies ChartConfig}
                      className="h-full w-full"
                    >
                      <BarChart
                        data={Array.from({ length: 32 }, (_, i) => ({
                          i,
                          v: 20 + Math.sin(i * 0.4) * 35 + (i % 5) * 5,
                        }))}
                        margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                      >
                        <XAxis dataKey="i" hide />
                        <YAxis hide />
                        <Bar dataKey="v" fill="hsl(166, 45%, 45%)" radius={[2, 2, 0, 0]} barSize={6} />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'branches' && (
          <>
            {branchesLoading ? (
              <TableSectionSkeleton cols={3} rows={3} />
            ) : branches.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No branches for this company.</p>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Name</th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Address</th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b) => (
                      <tr key={b.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">{b.name}</td>
                        <td className="py-2.5 pr-4 text-[var(--foreground-muted)]">{b.address ?? '—'}</td>
                        <td className="py-2.5 text-[var(--foreground-muted)]">{b.phone ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <>
            {membersLoading ? (
              <TableSectionSkeleton cols={5} rows={5} />
            ) : members.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No members for this company.</p>
            ) : (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="w-8 py-2 pr-2 text-left" aria-label="Expand" />
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">
                        Name
                      </th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">
                        Card no
                      </th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">
                        DOB
                      </th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">
                        Status
                      </th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isExpanded = expandedMemberId === m.id
                      const dependants = isExpanded ? expandedDependants : []
                      return (
                        <Fragment key={m.id}>
                          <tr
                            className="border-b border-[var(--border-subtle)] hover:bg-[var(--muted)]/20"
                          >
                            <td className="py-2 pr-2">
                              <button
                                type="button"
                                onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                                className="p-0.5 rounded text-[var(--foreground-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
                                aria-expanded={isExpanded}
                                aria-label={isExpanded ? 'Collapse dependants' : 'Expand dependants'}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="size-4" aria-hidden />
                                ) : (
                                  <ChevronRight className="size-4" aria-hidden />
                                )}
                              </button>
                            </td>
                            <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">
                              <Link
                                to="/members/$memberId"
                                params={{ memberId: m.id }}
                                className="text-[var(--primary)] hover:underline"
                              >
                                {m.name ?? '—'}
                              </Link>
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-[var(--foreground-muted)]">{m.card_no}</td>
                            <td className="py-2.5 pr-4 text-[var(--foreground-muted)]">{m.dob ?? '—'}</td>
                            <td className="py-2.5 pr-4 text-[var(--foreground-muted)]">{m.status}</td>
                            <td className="py-2.5">
                              <Button variant="ghost" size="sm" asChild>
                                <Link to="/members/$memberId" params={{ memberId: m.id }}>
                                  View & manage
                                </Link>
                              </Button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-[var(--muted)]/10">
                              <td colSpan={6} className="py-2 px-4">
                                <div className="pl-6 text-sm">
                                  <span className="font-medium text-[var(--foreground-muted)]">Dependants</span>
                                  {dependants.length === 0 ? (
                                    <p className="mt-1 text-[var(--foreground-muted)]">No dependants. View member to add.</p>
                                  ) : (
                                    <ul className="mt-1 space-y-1">
                                      {dependants.map((d) => (
                                        <li key={d.id} className="flex items-center gap-3 text-[var(--foreground-muted)]">
                                          <span className="font-medium text-[var(--foreground)]">{d.name}</span>
                                          <span className="font-mono text-xs">{d.card_no ?? '—'}</span>
                                          <span className="tabular-nums">{d.dob ?? '—'}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-[var(--primary)]" asChild>
                                    <Link to="/members/$memberId" params={{ memberId: m.id }}>
                                      Open member to add or edit dependants
                                    </Link>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'contracts' && (
          <>
            {schemesLoading ? (
              <TableSectionSkeleton cols={2} rows={3} />
            ) : schemes.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                No contracts (schemes) for this company.
              </p>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">
                        Name
                      </th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">{s.name}</td>
                        <td className="py-2.5 text-[var(--foreground-muted)]">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'schemes' && (
          <>
            {schemesLoading ? (
              <TableSectionSkeleton cols={2} rows={3} />
            ) : schemes.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No schemes for this company.</p>
            ) : (
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Name</th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemes.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">{s.name}</td>
                        <td className="py-2.5 text-[var(--foreground-muted)]">{s.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <>
            {summaryLoading ? (
              <AnalyticsSectionSkeleton />
            ) : !summary ? (
              <p className="text-sm text-[var(--foreground-muted)]">
                No analytics data for this company.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Members
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {summary.member_count}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Claims
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {summary.claim_count}
                  </p>
                </div>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground-muted)]">
                    Total amount
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {typeof summary.total_amount === 'number'
                      ? new Intl.NumberFormat(undefined, {
                          style: 'currency',
                          currency: 'USD',
                        }).format(summary.total_amount)
                      : String(summary.total_amount)}
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <EditCompanyDialog
        companyId={companyId}
        open={editOpen}
        onOpenChange={setEditOpen}
        companyTypes={companyTypes}
        onSuccess={() => {
          setEditOpen(false)
          queryClient.invalidateQueries({ queryKey: ['company', companyId] })
          queryClient.invalidateQueries({ queryKey: ['companies'] })
        }}
      />
    </div>
  )
}
