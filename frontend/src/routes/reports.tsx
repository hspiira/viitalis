import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/reports')({
  beforeLoad: () => requireAuthBeforeLoad('/reports'),
  component: ReportsPage,
})

interface CompanySummary {
  company_id: string
  company_name: string
  member_count: number
  claim_count: number
  total_amount: number | string | null
}

interface ClaimAnalysisSummary {
  status: string
  count: number
  total_amount: number | string | null
}

interface UtilisationByMember {
  member_id: string
  member_name: string
  card_no: string
  claim_count: number
  total_amount: number | string | null
}

interface HospitalSummary {
  hospital_id: string
  hospital_name: string
  claim_count: number
  total_amount: number | string | null
}

type ReportTab = 'company' | 'claim' | 'utilisation' | 'hospital'

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function ReportsPage() {
  const opts = useApiOpts()
  const [tab, setTab] = useState<ReportTab>('company')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [skip, setSkip] = useState(0)
  const limit = 50

  const companyParams = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  })
  if (companyId) companyParams.set('company_id', companyId)
  if (dateFrom) companyParams.set('date_from', dateFrom)
  if (dateTo) companyParams.set('date_to', dateTo)

  const claimParams = new URLSearchParams()
  if (dateFrom) claimParams.set('date_from', dateFrom)
  if (dateTo) claimParams.set('date_to', dateTo)

  const utilisationParams = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  })
  if (companyId) utilisationParams.set('company_id', companyId)
  if (dateFrom) utilisationParams.set('date_from', dateFrom)
  if (dateTo) utilisationParams.set('date_to', dateTo)

  const hospitalParams = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  })
  if (dateFrom) hospitalParams.set('date_from', dateFrom)
  if (dateTo) hospitalParams.set('date_to', dateTo)

  const { data: companyData = [], isLoading: companyLoading, error: companyError } = useQuery({
    queryKey: ['reports', 'company-summary', companyParams.toString(), opts.tenantId],
    queryFn: () =>
      apiGet<CompanySummary[]>(
        `/reports/company-summary?${companyParams}`,
        opts
      ),
    enabled: !!opts.tenantId && tab === 'company',
  })

  const { data: claimData = [], isLoading: claimLoading, error: claimError } = useQuery({
    queryKey: ['reports', 'claim-analysis', claimParams.toString(), opts.tenantId],
    queryFn: () =>
      apiGet<ClaimAnalysisSummary[]>(
        `/reports/claim-analysis?${claimParams}`,
        opts
      ),
    enabled: !!opts.tenantId && tab === 'claim',
  })

  const { data: utilisationData = [], isLoading: utilisationLoading, error: utilisationError } = useQuery({
    queryKey: ['reports', 'utilisation-by-member', utilisationParams.toString(), opts.tenantId],
    queryFn: () =>
      apiGet<UtilisationByMember[]>(
        `/reports/utilisation-by-member?${utilisationParams}`,
        opts
      ),
    enabled: !!opts.tenantId && tab === 'utilisation',
  })

  const { data: hospitalData = [], isLoading: hospitalLoading, error: hospitalError } = useQuery({
    queryKey: ['reports', 'hospital-summary', hospitalParams.toString(), opts.tenantId],
    queryFn: () =>
      apiGet<HospitalSummary[]>(
        `/reports/hospital-summary?${hospitalParams}`,
        opts
      ),
    enabled: !!opts.tenantId && tab === 'hospital',
  })

  const tabs: { id: ReportTab; label: string }[] = [
    { id: 'company', label: 'Company summary' },
    { id: 'claim', label: 'Claim analysis' },
    { id: 'utilisation', label: 'Utilisation by member' },
    { id: 'hospital', label: 'Hospital summary' },
  ]

  if (!opts.tenantId) {
    return (
      <div className="px-8 py-12 max-w-4xl">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Reports
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to view reports.
        </p>
      </div>
    )
  }

  const isLoading =
    tab === 'company'
      ? companyLoading
      : tab === 'claim'
        ? claimLoading
        : tab === 'utilisation'
          ? utilisationLoading
          : hospitalLoading
  const err =
    tab === 'company'
      ? companyError
      : tab === 'claim'
        ? claimError
        : tab === 'utilisation'
          ? utilisationError
          : hospitalError

  return (
    <div className="px-8 py-12 max-w-5xl">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-6">
        Reports
      </h1>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 text-sm ${
              tab === t.id
                ? 'bg-[var(--secondary)] text-[var(--foreground-active)]'
                : 'text-[var(--foreground-muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder="From"
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder="To"
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]"
        />
        {(tab === 'company' || tab === 'utilisation') && (
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Company ID filter"
            className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)] w-48"
          />
        )}
      </div>

      {err && (
        <p className="text-[var(--destructive)] mb-4">
          {getApiErrorDetail(err as { detail?: string })}
        </p>
      )}

      {isLoading ? (
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      ) : tab === 'company' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">Company</th>
                <th className="text-right py-2 font-medium">Members</th>
                <th className="text-right py-2 font-medium">Claims</th>
                <th className="text-right py-2 font-medium">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {companyData.map((r) => (
                <tr key={r.company_id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.company_name}</td>
                  <td className="py-2 text-right">{r.member_count}</td>
                  <td className="py-2 text-right">{r.claim_count}</td>
                  <td className="py-2 text-right">{String(r.total_amount ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'claim' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-right py-2 font-medium">Count</th>
                <th className="text-right py-2 font-medium">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {claimData.map((r) => (
                <tr key={r.status} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.status}</td>
                  <td className="py-2 text-right">{r.count}</td>
                  <td className="py-2 text-right">{String(r.total_amount ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'utilisation' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">Member</th>
                <th className="text-left py-2 font-medium">Card no</th>
                <th className="text-right py-2 font-medium">Claims</th>
                <th className="text-right py-2 font-medium">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {utilisationData.map((r) => (
                <tr key={r.member_id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.member_name}</td>
                  <td className="py-2">{r.card_no}</td>
                  <td className="py-2 text-right">{r.claim_count}</td>
                  <td className="py-2 text-right">{String(r.total_amount ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">Hospital</th>
                <th className="text-right py-2 font-medium">Claims</th>
                <th className="text-right py-2 font-medium">Total amount</th>
              </tr>
            </thead>
            <tbody>
              {hospitalData.map((r) => (
                <tr key={r.hospital_id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2">{r.hospital_name}</td>
                  <td className="py-2 text-right">{r.claim_count}</td>
                  <td className="py-2 text-right">{String(r.total_amount ?? '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(tab === 'company' || tab === 'utilisation' || tab === 'hospital') &&
        (companyData.length >= limit ||
          utilisationData.length >= limit ||
          hospitalData.length >= limit) && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSkip((s) => Math.max(0, s - limit))}
              disabled={skip === 0}
              className="text-sm text-[var(--foreground-muted)] disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setSkip((s) => s + limit)}
              className="text-sm text-[var(--foreground-muted)]"
            >
              Next
            </button>
          </div>
        )}
    </div>
  )
}
