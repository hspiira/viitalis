import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { apiGet } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap, formatCurrency } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import {
  Shield,
  SquarePen,
  ArrowLeft,
  FileStack,
  Gift,
} from 'lucide-react'
import { EditSchemeDialog, StatusBadge, type Scheme, type CompanyRef } from './schemes'

type SchemeDetailTab = 'overview' | 'plans' | 'benefits'

const TAB_IDS: SchemeDetailTab[] = ['overview', 'plans', 'benefits']

const SCHEME_DETAIL_TABS: {
  id: SchemeDetailTab
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { id: 'overview', label: 'Overview', icon: Shield },
  { id: 'plans', label: 'Plans', icon: FileStack },
  { id: 'benefits', label: 'Benefits', icon: Gift },
]

interface SchemePlanItem {
  id: string
  tenant_id: string
  scheme_id: string
  plan_id: string
  limit_amount: number | null
  begin_date: string | null
  end_date: string | null
  status: string
}

interface PlanRef {
  id: string
  name: string
  code: string | null
}

interface SchemeBenefitItem {
  id: string
  tenant_id: string
  scheme_id: string
  benefit_id: string
  limit_amount: number | null
  copayment_percent: number | null
  waiting_period_days: number | null
  status: string
  termination_date: string | null
}

interface BenefitRef {
  id: string
  name: string
  code: string | null
}

export const Route = createFileRoute('/schemes/$schemeId')({
  beforeLoad: () => requireAuthBeforeLoad('/schemes/$schemeId'),
  validateSearch: (search: Record<string, unknown>) => ({
    tab:
      typeof search.tab === 'string' && TAB_IDS.includes(search.tab as SchemeDetailTab)
        ? (search.tab as SchemeDetailTab)
        : ('overview' as SchemeDetailTab),
  }),
  component: SchemeDetailPage,
})

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-sm text-[var(--foreground-muted)]">{label}</dt>
      <dd className="text-sm text-[var(--foreground)]">{value ?? '—'}</dd>
    </>
  )
}

function SchemeDetailPage() {
  const { schemeId } = Route.useParams()
  const { tab: activeTab } = Route.useSearch()
  const opts = useApi()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const { data: scheme, isLoading: schemeLoading } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => apiGet<Scheme>(`/schemes/${schemeId}`, opts),
    enabled: !!schemeId && !!opts.tenantId && !!opts.token,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<CompanyRef[]>('/companies', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: schemePlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['schemes', schemeId, 'plans'],
    queryFn: () => apiGet<SchemePlanItem[]>(`/schemes/${schemeId}/plans?skip=0&limit=500`, opts),
    enabled: !!schemeId && activeTab === 'plans' && !!opts.tenantId && !!opts.token,
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', opts.tenantId],
    queryFn: () => apiGet<PlanRef[]>('/plans?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && activeTab === 'plans' && !!opts.token,
  })

  const { data: schemeBenefits = [], isLoading: benefitsLoading } = useQuery({
    queryKey: ['schemes', schemeId, 'benefits'],
    queryFn: () => apiGet<SchemeBenefitItem[]>(`/schemes/${schemeId}/benefits?skip=0&limit=500`, opts),
    enabled: !!schemeId && activeTab === 'benefits' && !!opts.tenantId && !!opts.token,
  })

  const { data: benefits = [] } = useQuery({
    queryKey: ['benefits', opts.tenantId],
    queryFn: () => apiGet<BenefitRef[]>('/benefits?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && activeTab === 'benefits' && !!opts.token,
  })

  const companyById = buildIdToEntityMap(companies)
  const planById = buildIdToEntityMap(plans)
  const benefitById = buildIdToEntityMap(benefits)

  const currentTabLabel =
    SCHEME_DETAIL_TABS.find((t) => t.id === activeTab)?.label ?? 'Scheme details'
  const schemeDisplayName = schemeLoading || !scheme ? '…' : scheme.name
  const pageTitle = schemeLoading || !scheme ? 'Scheme' : scheme.name

  const fmtDate = (d: string | null) => (d ? format(new Date(d), 'dd MMM yyyy') : '—')

  return (
    <div className="flex flex-col gap-0 min-h-0">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--muted)]/40 px-0 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/schemes" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              <ArrowLeft className="size-5" aria-label="Back to schemes" />
            </Link>
          </Button>
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Shield className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-[var(--foreground)]">{pageTitle}</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              View details, plans and benefits.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {scheme && (
            <Button onClick={() => setEditOpen(true)}>
              <SquarePen className="size-4 mr-1.5" aria-hidden />
              Edit scheme
            </Button>
          )}
        </div>
      </header>

      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--muted)]/20 px-0">
        {SCHEME_DETAIL_TABS.map(({ id, label, icon: Icon }) => (
          <Link
            key={id}
            to="/schemes/$schemeId"
            params={{ schemeId }}
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
              <Link to="/schemes" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                Schemes
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/schemes/$schemeId" params={{ schemeId }} search={{ tab: 'overview' }}>
                {schemeDisplayName}
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
        {activeTab === 'overview' && (
          <>
            {schemeLoading || !scheme ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : (
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <DetailRow label="Name" value={scheme.name} />
                <DetailRow label="Code" value={scheme.code} />
                <DetailRow label="Company" value={companyById[scheme.company_id]?.name ?? scheme.company_id} />
                <DetailRow label="Description" value={scheme.description} />
                <DetailRow
                  label="Limit"
                  value={scheme.limit_value != null ? formatCurrency(Number(scheme.limit_value)) : null}
                />
                <DetailRow label="Begin date" value={scheme.begin_date ? fmtDate(scheme.begin_date) : null} />
                <DetailRow label="End date" value={scheme.end_date ? fmtDate(scheme.end_date) : null} />
                <DetailRow label="Termination" value={scheme.termination_date ? fmtDate(scheme.termination_date) : null} />
                <dt className="text-[var(--foreground-muted)]">Status</dt>
                <dd>
                  <StatusBadge status={scheme.status} />
                </dd>
              </dl>
            )}
          </>
        )}

        {activeTab === 'plans' && (
          <>
            {plansLoading ? (
              <div className="rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left"><Skeleton className="h-4 w-24" /></th>
                      <th className="py-2 pr-4 text-left"><Skeleton className="h-4 w-20" /></th>
                      <th className="py-2 text-left"><Skeleton className="h-4 w-16" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-2.5 pr-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-2.5"><Skeleton className="h-4 w-16" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : schemePlans.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No plans linked to this scheme.</p>
            ) : (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Plan</th>
                      <th className="py-2 pr-4 text-right font-medium text-[var(--foreground-muted)]">Limit</th>
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Period</th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemePlans.map((sp) => (
                      <tr key={sp.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">
                          {planById[sp.plan_id]?.name ?? sp.plan_id}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-[var(--foreground-muted)]">
                          {sp.limit_amount != null ? formatCurrency(Number(sp.limit_amount)) : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-[var(--foreground-muted)] text-xs">
                          {sp.begin_date || sp.end_date
                            ? `${sp.begin_date ? fmtDate(sp.begin_date) : '—'} – ${sp.end_date ? fmtDate(sp.end_date) : '—'}`
                            : '—'}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={sp.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'benefits' && (
          <>
            {benefitsLoading ? (
              <div className="rounded-lg border border-[var(--border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)]">
                      <th className="py-2 pr-4 text-left"><Skeleton className="h-4 w-24" /></th>
                      <th className="py-2 pr-4 text-left"><Skeleton className="h-4 w-20" /></th>
                      <th className="py-2 text-left"><Skeleton className="h-4 w-16" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3].map((i) => (
                      <tr key={i} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4"><Skeleton className="h-4 w-32" /></td>
                        <td className="py-2.5 pr-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="py-2.5"><Skeleton className="h-4 w-16" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : schemeBenefits.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">No benefits linked to this scheme.</p>
            ) : (
              <div className="rounded-lg border border-[var(--border)] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                      <th className="py-2 pr-4 text-left font-medium text-[var(--foreground-muted)]">Benefit</th>
                      <th className="py-2 pr-4 text-right font-medium text-[var(--foreground-muted)]">Limit</th>
                      <th className="py-2 pr-4 text-right font-medium text-[var(--foreground-muted)]">Copay %</th>
                      <th className="py-2 text-left font-medium text-[var(--foreground-muted)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemeBenefits.map((sb) => (
                      <tr key={sb.id} className="border-b border-[var(--border-subtle)]">
                        <td className="py-2.5 pr-4 font-medium text-[var(--foreground)]">
                          {benefitById[sb.benefit_id]?.name ?? sb.benefit_id}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-[var(--foreground-muted)]">
                          {sb.limit_amount != null ? formatCurrency(Number(sb.limit_amount)) : '—'}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums text-[var(--foreground-muted)]">
                          {sb.copayment_percent != null ? `${sb.copayment_percent}%` : '—'}
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={sb.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <EditSchemeDialog
        schemeId={schemeId}
        open={editOpen}
        onOpenChange={setEditOpen}
        companies={companies}
        onSuccess={() => {
          setEditOpen(false)
          queryClient.invalidateQueries({ queryKey: ['scheme', schemeId] })
          queryClient.invalidateQueries({ queryKey: ['schemes'] })
        }}
      />
    </div>
  )
}
