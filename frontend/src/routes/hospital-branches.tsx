import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import { TableSkeleton } from '#/components/list-page'
import { Skeleton } from '#/components/ui/skeleton'
import { Building2, Plus, MapPin, SquareArrowOutUpRight, MoreVertical, SquarePen } from 'lucide-react'

export const Route = createFileRoute('/hospital-branches')({
  beforeLoad: () => requireAuthBeforeLoad('/hospital-branches'),
  component: HospitalBranchesPage,
})

interface HospitalBranch {
  id: string
  tenant_id: string
  hospital_id: string
  name: string
  address: string | null
}

function HospitalBranchesPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [selectedHospitalId, setSelectedHospitalId] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals-list', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>(`/hospitals?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const {
    data: branches = [],
    isLoading: branchesLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['hospitals', selectedHospitalId, 'branches'],
    queryFn: () =>
      apiGet<HospitalBranch[]>(
        `/hospitals/${selectedHospitalId}/branches?skip=0&limit=500`,
        opts
      ),
    enabled: !!opts.tenantId && !!opts.token && !!selectedHospitalId,
  })

  const selectedHospitalName =
    hospitals.find((h) => h.id === selectedHospitalId)?.name ?? ''

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Hospital branches
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage hospital branches.
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
            value={selectedHospitalId}
            onChange={(e) => {
              setSelectedHospitalId(e.target.value)
              setDetailId(null)
              setEditId(null)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Hospital"
          >
            <option value="">Select hospital</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        {selectedHospitalId && (
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

      {!selectedHospitalId ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Select a hospital</EmptyTitle>
            <EmptyDescription>
              Choose a hospital above to view and manage its branches.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : branchesLoading ? (
        <TableSkeleton columns={3} rows={5} />
      ) : branches.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No branches</EmptyTitle>
            <EmptyDescription>
              No branches for this hospital yet. Add one to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowCreate(true)}>Add branch</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="rounded-lg border border-[var(--border)] shadow-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
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
                      <MapPin className="size-3.5" aria-hidden />
                    </span>
                    Address
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
                  <td className="py-2.5 px-3">
                    <div className="relative flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-[var(--primary)] hover:opacity-80"
                        title="View"
                        aria-label="View branch"
                        onClick={() => setDetailId(b.id)}
                      >
                        <SquareArrowOutUpRight className="size-4" aria-hidden />
                      </Button>
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-[var(--icon-muted)] hover:opacity-80"
                          onClick={() => setOpenActionsId((id) => (id === b.id ? null : b.id))}
                          title="More actions"
                          aria-label="More actions"
                          aria-expanded={openActionsId === b.id}
                        >
                          <MoreVertical className="size-4" aria-hidden />
                        </Button>
                        {openActionsId === b.id && (
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
                                  setEditId(b.id)
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
      )}

      <CreateHospitalBranchDialog
        hospitalId={selectedHospitalId}
        hospitalName={selectedHospitalName}
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({
            queryKey: ['hospitals', selectedHospitalId, 'branches'],
          })
        }}
      />

      <HospitalBranchDetailDialog
        hospitalId={selectedHospitalId}
        branchId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditHospitalBranchDialog
        hospitalId={selectedHospitalId}
        branchId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({
            queryKey: ['hospitals', selectedHospitalId, 'branches'],
          })
          queryClient.invalidateQueries({ queryKey: ['hospital-branch'] })
        }}
      />
    </div>
  )
}

const inputBase =
  'w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent'
const labelBase = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1.5'

function FormField({
  id,
  label,
  icon: Icon,
  children,
  className,
}: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelBase}>
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          {label}
        </span>
      </label>
      {children}
    </div>
  )
}

function CreateHospitalBranchDialog({
  hospitalId,
  hospitalName,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  hospitalName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; address?: string }) =>
      apiPost<HospitalBranch>(`/hospitals/${hospitalId}/branches`, body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setAddress('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setAddress('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  if (!hospitalId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">New branch</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">
                {hospitalName ? `Add a branch for ${hospitalName}. Required fields are marked with *.` : 'Add a branch. Required fields are marked with *.'}
              </p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              address: address.trim() || undefined,
            })
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <FormField id="hb-name" label="Name *" icon={Building2}>
              <input
                id="hb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g. North Branch"
                className={inputBase}
              />
            </FormField>
            <FormField id="hb-address" label="Address" icon={MapPin}>
              <input
                id="hb-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city"
                className={inputBase}
              />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Creating…' : 'Create branch'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function HospitalBranchDetailDialog({
  hospitalId,
  branchId,
  open,
  onOpenChange,
  onEdit,
}: {
  hospitalId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: branch, isLoading } = useQuery({
    queryKey: ['hospital-branch', hospitalId, branchId],
    queryFn: () =>
      apiGet<HospitalBranch>(`/hospitals/${hospitalId}/branches/${branchId}`, opts),
    enabled: open && !!hospitalId && !!branchId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden">
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Branch details</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Details for the selected branch.</p>
            </div>
          </div>
        </header>
        {isLoading || !branch ? (
          <div className="px-6 py-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="px-6 py-5 space-y-3">
            <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                  <Building2 className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">Name:</span>
                <span className="text-sm text-[var(--foreground)] break-words min-w-0">{branch.name}</span>
              </div>
            </div>
            <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                  <MapPin className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">Address:</span>
                <span className="text-sm text-[var(--foreground)] break-words min-w-0">{branch.address ?? '—'}</span>
              </div>
            </div>
          </div>
        )}
        <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {branch && <Button onClick={() => onEdit(branch.id)}><SquarePen className="size-3.5 mr-1" aria-hidden />Edit</Button>}
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function EditHospitalBranchDialog({
  hospitalId,
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: branch } = useQuery({
    queryKey: ['hospital-branch', hospitalId, branchId],
    queryFn: () =>
      apiGet<HospitalBranch>(`/hospitals/${hospitalId}/branches/${branchId}`, opts),
    enabled: open && !!hospitalId && !!branchId && !!opts.tenantId && !!opts.token,
  })

  if (branch && !loaded) {
    setName(branch.name)
    setAddress(branch.address ?? '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; address?: string }) =>
      apiPatch<HospitalBranch>(`/hospitals/${hospitalId}/branches/${branchId}`, body, opts),
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

  if (!hospitalId || !branchId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit branch</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Update branch information. Required fields are marked with *.</p>
            </div>
          </div>
        </header>
        {!branch ? (
          <div className="px-6 py-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
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
              })
            }}
            className="flex flex-col"
          >
            <div className="flex-1 px-6 py-5 space-y-4">
              <FormField id="hbe-name" label="Name *" icon={Building2}>
                <input
                  id="hbe-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. North Branch"
                  className={inputBase}
                />
              </FormField>
              <FormField id="hbe-address" label="Address" icon={MapPin}>
                <input
                  id="hbe-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city"
                  className={inputBase}
                />
              </FormField>
              {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !name.trim()} className="min-w-[100px]">
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </footer>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
