import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
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
import { Users, Plus } from 'lucide-react'

export const Route = createFileRoute('/member-dependants')({
  beforeLoad: () => requireAuthBeforeLoad('/member-dependants'),
  component: MemberDependantsPage,
})

interface Dependant {
  id: string
  tenant_id: string
  member_id: string
  name: string
  card_no: string | null
  dob: string | null
}

interface MemberRef {
  id: string
  name: string
  card_no?: string
}

function MemberDependantsPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [selectedMemberId, setSelectedMemberId] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  const { data: members = [] } = useQuery({
    queryKey: ['members-list', opts.tenantId],
    queryFn: () => apiGet<MemberRef[]>(`/members?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const {
    data: dependants = [],
    isLoading: dependantsLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['members', selectedMemberId, 'dependants'],
    queryFn: () =>
      apiGet<Dependant[]>(
        `/members/${selectedMemberId}/dependants?skip=0&limit=500`,
        opts
      ),
    enabled: !!opts.tenantId && !!opts.token && !!selectedMemberId,
  })

  const selectedMemberName =
    members.find((m) => m.id === selectedMemberId)?.name ?? ''

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Member dependants
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage member dependants.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-[200px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Users className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={selectedMemberId}
            onChange={(e) => {
              setSelectedMemberId(e.target.value)
              setDetailId(null)
              setEditId(null)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Member"
          >
            <option value="">Select member</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name || m.card_no || m.id}
              </option>
            ))}
          </select>
        </div>
        {selectedMemberId && (
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add dependant
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

      {!selectedMemberId ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="size-6" />
            </EmptyMedia>
            <EmptyTitle>Select a member</EmptyTitle>
            <EmptyDescription>
              Choose a member above to view and manage their dependants.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : dependantsLoading ? (
        <TableSkeleton columns={4} rows={5} />
      ) : dependants.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No dependants</EmptyTitle>
            <EmptyDescription>
              No dependants for this member yet. Add one to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setShowCreate(true)}>Add dependant</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left py-2.5 px-3 font-medium">Name</th>
                <th className="text-left py-2.5 px-3 font-medium">Card no</th>
                <th className="text-left py-2.5 px-3 font-medium">DOB</th>
                <th className="text-left py-2.5 px-3 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {dependants.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                >
                  <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                    {d.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[var(--foreground-muted)]">
                    {d.card_no ?? '—'}
                  </td>
                  <td className="py-2.5 px-3 text-[var(--foreground-muted)] tabular-nums">
                    {d.dob ? format(new Date(d.dob), 'dd MMM yyyy') : '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDetailId(d.id)}
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

      <CreateDependantDialog
        memberId={selectedMemberId}
        memberName={selectedMemberName}
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({
            queryKey: ['members', selectedMemberId, 'dependants'],
          })
        }}
      />

      <DependantDetailDialog
        memberId={selectedMemberId}
        dependantId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditDependantDialog
        memberId={selectedMemberId}
        dependantId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({
            queryKey: ['members', selectedMemberId, 'dependants'],
          })
          queryClient.invalidateQueries({ queryKey: ['member-dependant'] })
        }}
      />
    </div>
  )
}

function CreateDependantDialog({
  memberId,
  memberName,
  open,
  onOpenChange,
  onSuccess,
}: {
  memberId: string
  memberName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [cardNo, setCardNo] = useState('')
  const [dob, setDob] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; card_no?: string; dob?: string }) =>
      apiPost<Dependant>(`/members/${memberId}/dependants`, body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setCardNo('')
      setDob('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setCardNo('')
      setDob('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  if (!memberId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New dependant</DialogTitle>
          <DialogDescription>
            {memberName ? `Add a dependant for ${memberName}.` : 'Add a dependant.'}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              card_no: cardNo.trim() || undefined,
              dob: dob.trim() || undefined,
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="dep-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="dep-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="dep-card" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Card no
            </label>
            <input
              id="dep-card"
              type="text"
              value={cardNo}
              onChange={(e) => setCardNo(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="dep-dob" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Date of birth
            </label>
            <input
              id="dep-dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
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

function DependantDetailDialog({
  memberId,
  dependantId,
  open,
  onOpenChange,
  onEdit,
}: {
  memberId: string
  dependantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: item, isLoading } = useQuery({
    queryKey: ['member-dependant', memberId, dependantId],
    queryFn: () =>
      apiGet<Dependant>(`/members/${memberId}/dependants/${dependantId}`, opts),
    enabled: open && !!memberId && !!dependantId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dependant details</DialogTitle>
          <DialogDescription>Details for the selected dependant.</DialogDescription>
        </DialogHeader>
        {isLoading || !item ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={item.name} />
            <DetailRow label="Card no" value={item.card_no} />
            <DetailRow
              label="DOB"
              value={item.dob ? format(new Date(item.dob), 'dd MMM yyyy') : null}
            />
          </dl>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {item && <Button onClick={() => onEdit(item.id)}>Edit</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditDependantDialog({
  memberId,
  dependantId,
  open,
  onOpenChange,
  onSuccess,
}: {
  memberId: string
  dependantId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [cardNo, setCardNo] = useState('')
  const [dob, setDob] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: item } = useQuery({
    queryKey: ['member-dependant', memberId, dependantId],
    queryFn: () =>
      apiGet<Dependant>(`/members/${memberId}/dependants/${dependantId}`, opts),
    enabled: open && !!memberId && !!dependantId && !!opts.tenantId && !!opts.token,
  })

  if (item && !loaded) {
    setName(item.name)
    setCardNo(item.card_no ?? '')
    setDob(item.dob ? item.dob.slice(0, 10) : '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; card_no?: string; dob?: string }) =>
      apiPatch<Dependant>(`/members/${memberId}/dependants/${dependantId}`, body, opts),
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

  if (!memberId || !dependantId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit dependant</DialogTitle>
          <DialogDescription>Update dependant information.</DialogDescription>
        </DialogHeader>
        {!item ? (
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
                card_no: cardNo.trim() || undefined,
                dob: dob.trim() || undefined,
              })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="dep-edit-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="dep-edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="dep-edit-card" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Card no
              </label>
              <input
                id="dep-edit-card"
                type="text"
                value={cardNo}
                onChange={(e) => setCardNo(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="dep-edit-dob" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Date of birth
              </label>
              <input
                id="dep-edit-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
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
