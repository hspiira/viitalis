import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useMemo } from 'react'
import { format, sub } from 'date-fns'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'
import { formatCurrency } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Card, CardHeader, CardTitle } from '#/components/ui/card'
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
  FileText,
  Search,
  Calendar,
  Send,
  Receipt,
  Filter,
  Building2,
  Hospital as HospitalIcon,
} from 'lucide-react'

export const Route = createFileRoute('/claims')({
  beforeLoad: () => requireAuthBeforeLoad('/claims'),
  component: ClaimsPage,
})

interface Claim {
  id: string
  tenant_id: string
  member_id: string
  dependant_id: string | null
  hospital_id: string
  doctor_id: string | null
  service_date: string
  total_amount: number | string | null
  status: string
  invoice_number: string | null
  approved_at: string | null
  approved_by: string | null
  approval_comments: string | null
  billing_session_id: string | null
}

const LIMIT = 20
const STATS_LIMIT = 500
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

const DATE_PRESETS = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: '90', label: 'Last 90 days', days: 90 },
  { id: '', label: 'All time', days: null },
] as const

function getPresetDates(presetId: string): { from: string; to: string } {
  const preset = DATE_PRESETS.find((p) => p.id === presetId)
  const to = new Date()
  const toStr = format(to, 'yyyy-MM-dd')
  if (!preset?.days) return { from: '', to: '' }
  const from = sub(to, { days: preset.days })
  return { from: format(from, 'yyyy-MM-dd'), to: toStr }
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'approved'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
      : status === 'rejected'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
        : status === 'submitted'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
          : 'bg-[var(--muted)] text-[var(--foreground-muted)]'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${variant}`}
    >
      {status}
    </span>
  )
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function ClaimsPage() {
  const opts = useApiOpts()
  const [datePreset, setDatePreset] = useState('7')
  const [dateFrom, setDateFrom] = useState(() => getPresetDates('7').from)
  const [dateTo, setDateTo] = useState(() => getPresetDates('7').to)
  const [statusFilter, setStatusFilter] = useState('')
  const [companyFilter, setCompanyFilter] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [detailClaimId, setDetailClaimId] = useState<string | null>(null)
  const [editClaimId, setEditClaimId] = useState<string | null>(null)

  useEffect(() => {
    const { from, to } = getPresetDates(datePreset)
    setDateFrom(from)
    setDateTo(to)
  }, [datePreset])

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })
  if (statusFilter) params.set('status', statusFilter)
  if (companyFilter) params.set('company_id', companyFilter)
  if (hospitalFilter) params.set('hospital_id', hospitalFilter)
  if (dateFrom) params.set('service_date_from', dateFrom)
  if (dateTo) params.set('service_date_to', dateTo)
  if (searchQuery.trim()) params.set('member_id', searchQuery.trim())

  const statsParams = new URLSearchParams({ limit: String(STATS_LIMIT) })
  if (dateFrom) statsParams.set('service_date_from', dateFrom)
  if (dateTo) statsParams.set('service_date_to', dateTo)
  if (companyFilter) statsParams.set('company_id', companyFilter)
  if (hospitalFilter) statsParams.set('hospital_id', hospitalFilter)

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claims', skip, LIMIT, statusFilter, companyFilter, hospitalFilter, dateFrom, dateTo, searchQuery.trim(), opts.tenantId],
    queryFn: () => apiGet<Claim[]>(`/claims?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/companies', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals-list', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>(`/hospitals?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: statsItems = [] } = useQuery({
    queryKey: ['claims-stats', dateFrom, dateTo, companyFilter, hospitalFilter, opts.tenantId],
    queryFn: () => apiGet<Claim[]>(`/claims?${statsParams}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const hospitalById = useMemo(
    () => Object.fromEntries((hospitals as { id: string; name: string }[]).map((h) => [h.id, h])),
    [hospitals]
  )

  const stats = useMemo(() => {
    const draft = statsItems.filter((c) => c.status === 'draft').length
    const submitted = statsItems.filter((c) => c.status === 'submitted').length
    const approved = statsItems.filter((c) => c.status === 'approved').length
    const rejected = statsItems.filter((c) => c.status === 'rejected').length
    const totalAmount = statsItems.reduce(
      (sum, c) => sum + (c.total_amount != null ? Number(c.total_amount) : 0),
      0
    )
    return { draft, submitted, approved, rejected, totalAmount, total: statsItems.length }
  }, [statsItems])

  const dateRangeLabel =
    dateFrom && dateTo
      ? `${format(new Date(dateFrom), 'd MMM, yyyy')} – ${format(new Date(dateTo), 'd MMM, yyyy')}`
      : 'All time'

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Claims
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage claims.
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
              <BreadcrumbPage>Claims</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="text-sm text-[var(--foreground-muted)]">
          Monitor and manage claims, approvals, and payments.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value)
              setSkip(0)
            }}
            className="rounded-md border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]"
            aria-label="Date range"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.id || 'all'} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2 rounded-md bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)]">
            <Calendar className="size-4 text-[var(--foreground-muted)]" aria-hidden />
            {dateRangeLabel}
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="ml-auto bg-[var(--primary)] text-[var(--primary-foreground)]"
          >
            New claim
          </Button>
        </div>
      </header>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-0 bg-[var(--card)] py-2 shadow-none">
          <CardHeader className="flex flex-col gap-1 px-3 pb-0">
            <div className="flex items-end gap-2">
              <FileText className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
              <CardTitle className="text-xs font-medium text-[var(--foreground-muted)] leading-none">
                Submission
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-3 pt-0.5">
              <div>
                <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">
                  {stats.draft}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Draft</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">
                  {stats.submitted}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Submitted</p>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-[var(--card)] py-2 shadow-none">
          <CardHeader className="flex flex-col gap-1 px-3 pb-0">
            <div className="flex items-end gap-2">
              <Send className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
              <CardTitle className="text-xs font-medium text-[var(--foreground-muted)] leading-none">
                Approvals
              </CardTitle>
            </div>
            <div className="flex flex-wrap gap-3 pt-0.5">
              <div>
                <p className="text-base font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats.approved}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Approved</p>
              </div>
              <div>
                <p className="text-base font-semibold tabular-nums text-red-500 dark:text-red-400">
                  {stats.rejected}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">Rejected</p>
              </div>
            </div>
          </CardHeader>
        </Card>
        <Card className="border-0 bg-[var(--card)] py-2 shadow-none sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-col gap-1 px-3 pb-0">
            <div className="flex items-end gap-2">
              <Receipt className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
              <CardTitle className="text-xs font-medium text-[var(--foreground-muted)] leading-none">
                Total amount
              </CardTitle>
            </div>
            <p className="text-lg font-semibold tabular-nums tracking-tight text-[var(--foreground)] pt-0.5">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-xs text-[var(--foreground-muted)]">
              {stats.total} claims in range
            </p>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-base font-semibold text-[var(--foreground)]">Recent claims</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex h-8 min-w-[200px] max-w-[280px] flex-1 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
            <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <input
              type="search"
              placeholder="Search by Member ID"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSkip(0)
              }}
              className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
              aria-label="Search claims"
            />
          </div>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
            <Calendar className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <select
              value={datePreset}
              onChange={(e) => {
                setDatePreset(e.target.value)
                setSkip(0)
              }}
              className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
              aria-label="Date range"
            >
              {DATE_PRESETS.map((p) => (
                <option key={p.id || 'all'} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <span className="min-w-[120px] text-[var(--foreground-muted)]">
            {dateRangeLabel}
          </span>
          <div className="flex h-8 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
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
          <div className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
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
          <div className="flex h-8 min-w-[160px] items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
            <HospitalIcon className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <select
              value={hospitalFilter}
              onChange={(e) => {
                setHospitalFilter(e.target.value)
                setSkip(0)
              }}
              className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
              aria-label="Hospital"
            >
              <option value="">All hospitals</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
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
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2 px-3 font-medium">Claim</th>
                  <th className="text-left py-2 px-3 font-medium">Member</th>
                  <th className="text-left py-2 px-3 font-medium">Hospital</th>
                  <th className="text-right py-2 px-3 font-medium">Service date</th>
                  <th className="text-right py-2 px-3 font-medium">Amount</th>
                  <th className="text-left py-2 px-3 font-medium">Status</th>
                  <th className="text-left py-2 px-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2 px-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="py-2 px-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-2 px-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-2 px-3 text-right"><Skeleton className="h-4 w-24 inline-block" /></td>
                    <td className="py-2 px-3 text-right"><Skeleton className="h-4 w-16 inline-block" /></td>
                    <td className="py-2 px-3"><Skeleton className="h-4 w-16" /></td>
                    <td className="py-2 px-3"><Skeleton className="h-6 w-14" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : items.length === 0 ? (
          <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FileText className="size-6" />
              </EmptyMedia>
              <EmptyTitle>No claims</EmptyTitle>
              <EmptyDescription>
                No claims match your filters. Try changing the filters or create a new claim.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusFilter('')
                  setCompanyFilter('')
                  setHospitalFilter('')
                  setSearchQuery('')
                  setDatePreset('')
                  setDateFrom('')
                  setDateTo('')
                  setSkip(0)
                  refetch()
                }}
              >
                Clear filters
              </Button>
              <Button onClick={() => setShowCreate(true)}>
                New claim
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                    <th className="text-left py-2 px-3 font-medium">Claim</th>
                    <th className="text-left py-2 px-3 font-medium">Member</th>
                    <th className="text-left py-2 px-3 font-medium">Hospital</th>
                    <th className="text-right py-2 px-3 font-medium">Service date</th>
                    <th className="text-right py-2 px-3 font-medium">Amount</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                    >
                      <td className="py-2 px-3 font-mono text-xs text-[var(--foreground-muted)]">
                        {claim.id.slice(-8)}
                      </td>
                      <td className="py-2 px-3">{claim.member_id}</td>
                      <td className="max-w-[200px] truncate py-2 px-3" title={hospitalById[claim.hospital_id]?.name ?? claim.hospital_id}>
                        {hospitalById[claim.hospital_id]?.name ?? claim.hospital_id}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {claim.service_date
                          ? format(new Date(claim.service_date), 'dd MMM yyyy')
                          : '—'}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {claim.total_amount != null
                          ? formatCurrency(Number(claim.total_amount))
                          : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <StatusBadge status={claim.status} />
                      </td>
                      <td className="py-2 px-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailClaimId(claim.id)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2">
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
      </section>

      <CreateClaimDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['claims'] })
        }}
      />

      <ClaimDetailDialog
        claimId={detailClaimId ?? ''}
        open={!!detailClaimId}
        onOpenChange={(open) => !open && setDetailClaimId(null)}
        onEdit={(id) => {
          setDetailClaimId(null)
          setEditClaimId(id)
        }}
      />

      <EditClaimDialog
        claimId={editClaimId ?? ''}
        open={!!editClaimId}
        onOpenChange={(open) => !open && setEditClaimId(null)}
        onSuccess={() => {
          setEditClaimId(null)
          queryClient.invalidateQueries({ queryKey: ['claims'] })
          queryClient.invalidateQueries({ queryKey: ['claim'] })
        }}
      />
    </div>
  )
}

function CreateClaimDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApiOpts()
  const [memberId, setMemberId] = useState('')
  const [hospitalId, setHospitalId] = useState('')
  const [serviceDate, setServiceDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState('draft')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: {
      member_id: string
      hospital_id: string
      service_date: string
      total_amount?: number
      status: string
      details: unknown[]
    }) => apiPost<Claim>('/claims', body, opts),
    onSuccess: () => {
      onSuccess()
      setMemberId('')
      setHospitalId('')
      setServiceDate(format(new Date(), 'yyyy-MM-dd'))
      setTotalAmount('')
      setStatus('draft')
      setSubmitError(null)
    },
    onError: (err: { detail?: string }) => {
      setSubmitError(getApiErrorDetail(err))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!memberId.trim() || !hospitalId.trim() || !serviceDate) return
    createMutation.mutate({
      member_id: memberId.trim(),
      hospital_id: hospitalId.trim(),
      service_date: serviceDate,
      total_amount: totalAmount ? Number(totalAmount) : undefined,
      status,
      details: [],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New claim</DialogTitle>
          <DialogDescription>
            Create a new claim. Member and hospital must exist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Member ID</label>
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Hospital ID</label>
            <input
              type="text"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Service date</label>
            <input
              type="date"
              value={serviceDate}
              onChange={(e) => setServiceDate(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Total amount (optional)</label>
            <input
              type="number"
              step="0.01"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
          {submitError && (
            <p className="text-sm text-[var(--destructive)]">{submitError}</p>
          )}
          <DialogFooter showCloseButton={false}>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditClaimDialog({
  claimId,
  open,
  onOpenChange,
  onSuccess,
}: {
  claimId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApiOpts()
  const { data: claim, isLoading } = useQuery({
    queryKey: ['claim', claimId, opts.tenantId],
    queryFn: () => apiGet<Claim>(`/claims/${claimId}`, opts),
    enabled: open && !!claimId && !!opts.tenantId,
  })

  const [serviceDate, setServiceDate] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [status, setStatus] = useState('draft')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateMutation = useMutation({
    mutationFn: (body: {
      service_date?: string
      total_amount?: number
      status?: string
      invoice_number?: string
    }) => apiPatch<Claim>(`/claims/${claimId}`, body, opts),
    onSuccess: () => {
      onSuccess()
      setSubmitError(null)
    },
    onError: (err: { detail?: string }) => {
      setSubmitError(getApiErrorDetail(err))
    },
  })

  useEffect(() => {
    if (claim) {
      setServiceDate(claim.service_date || '')
      setTotalAmount(claim.total_amount != null ? String(claim.total_amount) : '')
      setStatus(claim.status || 'draft')
      setInvoiceNumber(claim.invoice_number || '')
    }
  }, [claim])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    updateMutation.mutate({
      service_date: serviceDate || undefined,
      total_amount: totalAmount ? Number(totalAmount) : undefined,
      status: status || undefined,
      invoice_number: invoiceNumber || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit claim</DialogTitle>
          <DialogDescription>
            Update claim fields. Only modified fields are sent.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>}
        {claim && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Service date</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Total amount</label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              >
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-muted)] mb-1">Invoice number (optional)</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            {submitError && (
              <p className="text-sm text-[var(--destructive)]">{submitError}</p>
            )}
            <DialogFooter showCloseButton={false}>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ClaimDetailDialog({
  claimId,
  open,
  onOpenChange,
  onEdit,
}: {
  claimId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (claimId: string) => void
}) {
  const opts = useApiOpts()
  const { data: claim, isLoading, error } = useQuery({
    queryKey: ['claim', claimId, opts.tenantId],
    queryFn: () => apiGet<Claim>(`/claims/${claimId}`, opts),
    enabled: open && !!claimId && !!opts.tenantId,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Claim detail</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-[var(--foreground-muted)]">Loading…</p>}
        {error && (
          <p className="text-sm text-[var(--destructive)]">
            {getApiErrorDetail(error as { detail?: string })}
          </p>
        )}
        {claim && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-[var(--foreground-muted)]">ID</dt>
            <dd className="font-mono text-xs">{claim.id}</dd>
            <dt className="text-[var(--foreground-muted)]">Member</dt>
            <dd>{claim.member_id}</dd>
            <dt className="text-[var(--foreground-muted)]">Hospital</dt>
            <dd>{claim.hospital_id}</dd>
            <dt className="text-[var(--foreground-muted)]">Service date</dt>
            <dd>{claim.service_date ? format(new Date(claim.service_date), 'dd MMM yyyy') : '—'}</dd>
            <dt className="text-[var(--foreground-muted)]">Total amount</dt>
            <dd>{claim.total_amount != null ? formatCurrency(Number(claim.total_amount)) : '—'}</dd>
            <dt className="text-[var(--foreground-muted)]">Status</dt>
            <dd>{claim.status}</dd>
            {claim.invoice_number && (
              <>
                <dt className="text-[var(--foreground-muted)]">Invoice</dt>
                <dd>{claim.invoice_number}</dd>
              </>
            )}
          </dl>
        )}
        <DialogFooter showCloseButton={false}>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {claim && (
            <Button onClick={() => onEdit(claim.id)}>Edit</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
