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
import { DetailRow, ListPagePagination, TableSkeleton } from '#/components/list-page'
import { Building2, Search, Plus } from 'lucide-react'

export const Route = createFileRoute('/hospitals')({
  beforeLoad: () => requireAuthBeforeLoad('/hospitals'),
  component: HospitalsPage,
})

interface Hospital {
  id: string
  tenant_id: string
  name: string
  address: string | null
}

const LIMIT = 20

function HospitalsPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const params = new URLSearchParams({ skip: String(skip), limit: String(LIMIT) })

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['hospitals', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<Hospital[]>(`/hospitals?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = searchQuery.trim()
    ? items.filter((h) =>
        h.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Hospitals
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage hospitals.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-0 max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Search hospitals"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search hospitals"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add hospital
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
        <TableSkeleton columns={3} rows={5} />
      ) : filteredItems.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No hospitals</EmptyTitle>
            <EmptyDescription>
              No hospitals match your search. Try changing the search or add a new hospital.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('')
                setSkip(0)
                refetch()
              }}
            >
              Clear search
            </Button>
            <Button onClick={() => setShowCreate(true)}>Add hospital</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Address</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {h.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {h.address ?? '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailId(h.id)}
                      >
                        View
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

      <CreateHospitalDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        }}
      />

      <HospitalDetailDialog
        hospitalId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditHospitalDialog
        hospitalId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({ queryKey: ['hospitals'] })
          queryClient.invalidateQueries({ queryKey: ['hospital'] })
        }}
      />
    </div>
  )
}

/* ─── Create dialog ─── */

function CreateHospitalDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
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
      apiPost<Hospital>('/hospitals', body, opts),
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New hospital</DialogTitle>
          <DialogDescription>Add a new hospital.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({ name: name.trim(), address: address.trim() || undefined })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="h-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="h-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="h-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Address
            </label>
            <input
              id="h-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
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

function HospitalDetailDialog({
  hospitalId,
  open,
  onOpenChange,
  onEdit,
}: {
  hospitalId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: hospital, isLoading } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => apiGet<Hospital>(`/hospitals/${hospitalId}`, opts),
    enabled: open && !!hospitalId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Hospital details</DialogTitle>
          <DialogDescription>Details for the selected hospital.</DialogDescription>
        </DialogHeader>
        {isLoading || !hospital ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={hospital.name} />
            <DetailRow label="Address" value={hospital.address} />
          </dl>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {hospital && <Button onClick={() => onEdit(hospital.id)}>Edit</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit dialog ─── */

function EditHospitalDialog({
  hospitalId,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: hospital } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => apiGet<Hospital>(`/hospitals/${hospitalId}`, opts),
    enabled: open && !!hospitalId && !!opts.tenantId && !!opts.token,
  })

  if (hospital && !loaded) {
    setName(hospital.name)
    setAddress(hospital.address ?? '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; address?: string }) =>
      apiPatch<Hospital>(`/hospitals/${hospitalId}`, body, opts),
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit hospital</DialogTitle>
          <DialogDescription>Update hospital information.</DialogDescription>
        </DialogHeader>
        {!hospital ? (
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
              updateMutation.mutate({ name: name.trim(), address: address.trim() || undefined })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="he-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="he-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="he-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Address
              </label>
              <input
                id="he-address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
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
