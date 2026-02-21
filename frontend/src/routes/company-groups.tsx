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

export const Route = createFileRoute('/company-groups')({
  beforeLoad: () => requireAuthBeforeLoad('/company-groups'),
  component: CompanyGroupsPage,
})

interface CompanyGroup {
  id: string
  tenant_id: string
  name: string
  description: string | null
  status: string
}

const LIMIT = 50

function CompanyGroupsPage() {
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
    queryKey: ['company-groups', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<CompanyGroup[]>(`/company-groups?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = searchQuery.trim()
    ? items.filter((g) =>
        g.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (g.description || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Company groups
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage company groups.
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
            placeholder="Search groups"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search company groups"
          />
        </div>
        <div className="ml-auto flex shrink-0">
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add group
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
        <TableSkeleton columns={4} rows={5} />
      ) : filteredItems.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No company groups</EmptyTitle>
            <EmptyDescription>
              No company groups match your search. Add one to get started.
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
            <Button onClick={() => setShowCreate(true)}>Add group</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Description</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((g) => (
                  <tr
                    key={g.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {g.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)] max-w-xs truncate">
                      {g.description ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {g.status}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailId(g.id)}
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

      <CreateCompanyGroupDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['company-groups'] })
        }}
      />

      <CompanyGroupDetailDialog
        groupId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditCompanyGroupDialog
        groupId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({ queryKey: ['company-groups'] })
          queryClient.invalidateQueries({ queryKey: ['company-group'] })
        }}
      />
    </div>
  )
}

/* ─── Create dialog ─── */

function CreateCompanyGroupDialog({
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
  const [description, setDescription] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: {
      name: string
      description?: string
      status: string
    }) => apiPost<CompanyGroup>('/company-groups', body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setDescription('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setDescription('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New company group</DialogTitle>
          <DialogDescription>Add a new company group.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              description: description.trim() || undefined,
              status: 'active',
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="cg-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="cg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="cg-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Description
            </label>
            <textarea
              id="cg-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
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

function CompanyGroupDetailDialog({
  groupId,
  open,
  onOpenChange,
  onEdit,
}: {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: item, isLoading } = useQuery({
    queryKey: ['company-group', groupId],
    queryFn: () => apiGet<CompanyGroup>(`/company-groups/${groupId}`, opts),
    enabled: open && !!groupId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Company group details</DialogTitle>
          <DialogDescription>Details for the selected group.</DialogDescription>
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
            <DetailRow label="Description" value={item.description} />
            <DetailRow label="Status" value={item.status} />
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

/* ─── Edit dialog ─── */

function EditCompanyGroupDialog({
  groupId,
  open,
  onOpenChange,
  onSuccess,
}: {
  groupId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: item } = useQuery({
    queryKey: ['company-group', groupId],
    queryFn: () => apiGet<CompanyGroup>(`/company-groups/${groupId}`, opts),
    enabled: open && !!groupId && !!opts.tenantId && !!opts.token,
  })

  if (item && !loaded) {
    setName(item.name)
    setDescription(item.description ?? '')
    setStatus(item.status)
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: {
      name: string
      description?: string
      status: string
    }) => apiPatch<CompanyGroup>(`/company-groups/${groupId}`, body, opts),
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
          <DialogTitle>Edit company group</DialogTitle>
          <DialogDescription>Update company group information.</DialogDescription>
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
                description: description.trim() || undefined,
                status,
              })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="cge-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="cge-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="cge-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Description
              </label>
              <textarea
                id="cge-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
              />
            </div>
            <div>
              <label htmlFor="cge-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Status
              </label>
              <select
                id="cge-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
