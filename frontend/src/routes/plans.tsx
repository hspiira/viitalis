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
import { DetailRow, TablePagination, TableSkeleton } from '#/components/list-page'
import { FileStack, Search, Plus } from 'lucide-react'

export const Route = createFileRoute('/plans')({
  beforeLoad: () => requireAuthBeforeLoad('/plans'),
  component: PlansPage,
})

interface Plan {
  id: string
  tenant_id: string
  name: string
  code: string | null
}

const LIMIT = 50

function PlansPage() {
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
    queryKey: ['plans', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<Plan[]>(`/plans?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (p.code || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Plans
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage plans.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2 text-sm">
        <div className="flex h-7 min-w-0 max-w-[180px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2">
          <Search className="size-3 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Search plans"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search plans"
          />
        </div>
        <div className="ml-auto flex shrink-0">
          <Button
            onClick={() => setShowCreate(true)}
            className="h-7 bg-[var(--primary)] px-2.5 text-[var(--primary-foreground)] text-xs"
          >
            <Plus className="size-3 mr-1" aria-hidden />
            Add plan
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
              <FileStack className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No plans</EmptyTitle>
            <EmptyDescription>
              No plans match your search. Add one to get started.
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
            <Button onClick={() => setShowCreate(true)}>Add plan</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-1.5 px-3 font-medium text-[var(--foreground-muted)] w-[45%]">Name</th>
                  <th className="text-left py-1.5 px-3 font-medium text-[var(--foreground-muted)] w-[35%]">Code</th>
                  <th className="text-left py-1.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-1.5 px-3 font-medium text-[var(--foreground)] min-w-0 truncate" title={p.name}>
                      {p.name}
                    </td>
                    <td className="py-1.5 px-3 text-[var(--foreground-muted)] min-w-0 truncate" title={p.code ?? undefined}>
                      {p.code ?? '—'}
                    </td>
                    <td className="py-1.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setDetailId(p.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            skip={skip}
            limit={LIMIT}
            currentPageSize={items.length}
            onSkipChange={setSkip}
          />
        </>
      )}

      <CreatePlanDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['plans'] })
        }}
      />

      <PlanDetailDialog
        planId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditPlanDialog
        planId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({ queryKey: ['plans'] })
          queryClient.invalidateQueries({ queryKey: ['plan'] })
        }}
      />
    </div>
  )
}

function CreatePlanDialog({
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
  const [code, setCode] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; code?: string }) =>
      apiPost<Plan>('/plans', body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setCode('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setCode('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
          <DialogDescription>Add a plan.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({ name: name.trim(), code: code.trim() || undefined })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="plan-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="plan-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="plan-code" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Code
            </label>
            <input
              id="plan-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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

function PlanDetailDialog({
  planId,
  open,
  onOpenChange,
  onEdit,
}: {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: item, isLoading } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => apiGet<Plan>(`/plans/${planId}`, opts),
    enabled: open && !!planId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan details</DialogTitle>
          <DialogDescription>Details for the selected plan.</DialogDescription>
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
            <DetailRow label="Code" value={item.code} />
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

function EditPlanDialog({
  planId,
  open,
  onOpenChange,
  onSuccess,
}: {
  planId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: item } = useQuery({
    queryKey: ['plan', planId],
    queryFn: () => apiGet<Plan>(`/plans/${planId}`, opts),
    enabled: open && !!planId && !!opts.tenantId && !!opts.token,
  })

  if (item && !loaded) {
    setName(item.name)
    setCode(item.code ?? '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; code?: string }) =>
      apiPatch<Plan>(`/plans/${planId}`, body, opts),
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
          <DialogTitle>Edit plan</DialogTitle>
          <DialogDescription>Update plan information.</DialogDescription>
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
              updateMutation.mutate({ name: name.trim(), code: code.trim() || undefined })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="plan-edit-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="plan-edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="plan-edit-code" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Code
              </label>
              <input
                id="plan-edit-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
