import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
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
import { DetailRow, TableSkeleton } from '#/components/list-page'
import { Building2, Plus } from 'lucide-react'

export const Route = createFileRoute('/company-branches')({
  beforeLoad: () => requireAuthBeforeLoad('/company-branches'),
  component: CompanyBranchesPage,
})

interface Branch {
  id: string
  tenant_id: string
  company_id: string
  name: string
  address: string | null
  phone: string | null
}

function CompanyBranchesPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/companies?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const {
    data: branches = [],
    isLoading: branchesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', selectedCompanyId, 'branches'],
    queryFn: () =>
      apiGet<Branch[]>(
        `/companies/${selectedCompanyId}/branches?skip=0&limit=500`,
        opts
      ),
    enabled: !!opts.tenantId && !!opts.token && !!selectedCompanyId,
  })

  const selectedCompanyName =
    companies.find((c) => c.id === selectedCompanyId)?.name ?? ''

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Company branches
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage company branches.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-[200px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Building2 className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={selectedCompanyId}
            onChange={(e) => {
              setSelectedCompanyId(e.target.value)
              setDetailId(null)
              setEditId(null)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Company"
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {selectedCompanyId && (
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add branch
          </Button>
        )}
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

      {!selectedCompanyId ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Select a company</EmptyTitle>
            <EmptyDescription>
              Choose a company above to view and manage its branches.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : branchesLoading ? (
        <TableSkeleton columns={4} rows={5} />
      ) : branches.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No branches</EmptyTitle>
            <EmptyDescription>
              No branches for this company yet. Add one to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowCreate(true)}>Add branch</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left py-2.5 px-3 font-medium">Name</th>
                <th className="text-left py-2.5 px-3 font-medium">Address</th>
                <th className="text-left py-2.5 px-3 font-medium">Phone</th>
                <th className="text-left py-2.5 px-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                >
                  <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                    {b.name}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--foreground-muted)] max-w-xs truncate">
                    {b.address ?? '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                    {b.phone ?? '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailId(b.id)}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateBranchDialog
        companyId={selectedCompanyId}
        companyName={selectedCompanyName}
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({
            queryKey: ['companies', selectedCompanyId, 'branches'],
          })
        }}
      />

      <BranchDetailDialog
        companyId={selectedCompanyId}
        branchId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditBranchDialog
        companyId={selectedCompanyId}
        branchId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({
            queryKey: ['companies', selectedCompanyId, 'branches'],
          })
          queryClient.invalidateQueries({ queryKey: ['company-branch'] })
        }}
      />
    </div>
  )
}

/* ─── Create dialog ─── */

function CreateBranchDialog({
  companyId,
  companyName,
  open,
  onOpenChange,
  onSuccess,
}: {
  companyId: string
  companyName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; address?: string; phone?: string }) =>
      apiPost<Branch>(`/companies/${companyId}/branches`, body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setAddress('')
      setPhone('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setAddress('')
      setPhone('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  if (!companyId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New branch</DialogTitle>
          <DialogDescription>
            {companyName ? `Add a branch for ${companyName}.` : 'Add a branch.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              address: address.trim() || undefined,
              phone: phone.trim() || undefined,
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="br-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="br-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="br-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Address
            </label>
            <input
              id="br-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="br-phone" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Phone
            </label>
            <input
              id="br-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Detail dialog ─── */

function BranchDetailDialog({
  companyId,
  branchId,
  open,
  onOpenChange,
  onEdit,
}: {
  companyId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: branch, isLoading } = useQuery({
    queryKey: ['company-branch', companyId, branchId],
    queryFn: () =>
      apiGet<Branch>(`/companies/${companyId}/branches/${branchId}`, opts),
    enabled: open && !!companyId && !!branchId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Branch details</DialogTitle>
          <DialogDescription>Details for the selected branch.</DialogDescription>
        </DialogHeader>
        {isLoading || !branch ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={branch.name} />
            <DetailRow label="Address" value={branch.address} />
            <DetailRow label="Phone" value={branch.phone} />
          </dl>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {branch && <Button onClick={() => onEdit(branch.id)}>Edit</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit dialog ─── */

function EditBranchDialog({
  companyId,
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: {
  companyId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: branch } = useQuery({
    queryKey: ['company-branch', companyId, branchId],
    queryFn: () =>
      apiGet<Branch>(`/companies/${companyId}/branches/${branchId}`, opts),
    enabled: open && !!companyId && !!branchId && !!opts.tenantId && !!opts.token,
  })

  if (branch && !loaded) {
    setName(branch.name)
    setAddress(branch.address ?? '')
    setPhone(branch.phone ?? '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; address?: string; phone?: string }) =>
      apiPatch<Branch>(`/companies/${companyId}/branches/${branchId}`, body, opts),
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

  if (!companyId || !branchId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit branch</DialogTitle>
          <DialogDescription>Update branch information.</DialogDescription>
        </DialogHeader>
        {!branch ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              updateMutation.mutate({
                name: name.trim(),
                address: address.trim() || undefined,
                phone: phone.trim() || undefined,
              })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="bre-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="bre-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="bre-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Address
              </label>
              <input
                id="bre-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="bre-phone" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Phone
              </label>
              <input
                id="bre-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !name.trim()}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
