import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'
import { formatCurrency } from '#/lib/utils'
import { Button } from '#/components/ui/button'
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
import { FileText } from 'lucide-react'

export const Route = createFileRoute('/claims')({
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
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
]

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function ClaimsPage() {
  const opts = useApiOpts()
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [skip, setSkip] = useState(0)
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [detailClaimId, setDetailClaimId] = useState<string | null>(null)
  const [editClaimId, setEditClaimId] = useState<string | null>(null)

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })
  if (statusFilter) params.set('status', statusFilter)
  if (dateFrom) params.set('service_date_from', dateFrom)
  if (dateTo) params.set('service_date_to', dateTo)

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['claims', skip, LIMIT, statusFilter, dateFrom, dateTo, opts.tenantId],
    queryFn: () => apiGet<Claim[]>(`/claims?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="p-6 md:p-8 max-w-4xl">
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
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Claims
        </h1>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[var(--primary)] text-[var(--primary-foreground)]"
        >
          New claim
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-[var(--foreground-muted)]">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value)
            setSkip(0)
          }}
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="text-sm text-[var(--foreground-muted)] ml-2">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value)
            setSkip(0)
          }}
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
        />
        <label className="text-sm text-[var(--foreground-muted)]">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value)
            setSkip(0)
          }}
          className="border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>

      {error && (
        <div className="mb-4 flex flex-col gap-2">
          <p className="text-[var(--destructive)]">
            {getApiErrorDetail(error as { detail?: string })}
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 font-medium">ID</th>
                <th className="text-left py-2 font-medium">Member</th>
                <th className="text-left py-2 font-medium">Hospital</th>
                <th className="text-right py-2 font-medium">Service date</th>
                <th className="text-right py-2 font-medium">Amount</th>
                <th className="text-left py-2 font-medium">Status</th>
                <th className="text-left py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-2"><Skeleton className="h-4 w-24" /></td>
                  <td className="py-2 text-right"><Skeleton className="h-4 w-24 inline-block" /></td>
                  <td className="py-2 text-right"><Skeleton className="h-4 w-16 inline-block" /></td>
                  <td className="py-2"><Skeleton className="h-4 w-16" /></td>
                  <td className="py-2"><Skeleton className="h-6 w-14" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : items.length === 0 ? (
        <Empty className="border-0 py-12">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 font-medium">ID</th>
                  <th className="text-left py-2 font-medium">Member</th>
                  <th className="text-left py-2 font-medium">Hospital</th>
                  <th className="text-right py-2 font-medium">Service date</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((claim) => (
                  <tr
                    key={claim.id}
                    className="border-b border-[var(--border-subtle)]"
                  >
                    <td className="py-2 font-mono text-xs text-[var(--foreground-muted)]">
                      {claim.id.slice(-8)}
                    </td>
                    <td className="py-2">{claim.member_id}</td>
                    <td className="py-2">{claim.hospital_id}</td>
                    <td className="py-2 text-right tabular-nums">
                      {claim.service_date
                        ? format(new Date(claim.service_date), 'dd MMM yyyy')
                        : '—'}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {claim.total_amount != null
                        ? formatCurrency(Number(claim.total_amount))
                        : '—'}
                    </td>
                    <td className="py-2">{claim.status}</td>
                    <td className="py-2">
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

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-[var(--foreground-muted)]">
              Page {Math.floor(skip / LIMIT) + 1} · {items.length} rows
            </p>
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
