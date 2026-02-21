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
import { Layers, Search, Plus } from 'lucide-react'

export const Route = createFileRoute('/company-types')({
  beforeLoad: () => requireAuthBeforeLoad('/company-types'),
  component: CompanyTypesPage,
})

interface CompanyType {
  id: string
  tenant_id: string
  name: string
  code: string | null
  description: string | null
  status: string
}

const LIMIT = 50

function CompanyTypesPage() {
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
    queryKey: ['company-types', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<CompanyType[]>(`/company-types?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (t.code || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Company types
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage company types.
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
            placeholder="Search types"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search company types"
          />
        </div>
        <div className="ml-auto flex shrink-0">
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add type
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
              <Layers className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No company types</EmptyTitle>
            <EmptyDescription>
              No company types match your search. Add one to get started.
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
            <Button onClick={() => setShowCreate(true)}>Add type</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Code</th>
                  <th className="text-left py-2.5 px-3 font-medium">Status</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {t.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {t.code ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {t.status}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailId(t.id)}
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

      <CreateCompanyTypeDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['company-types'] })
        }}
      />

      <CompanyTypeDetailDialog
        typeId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditCompanyTypeDialog
        typeId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({ queryKey: ['company-types'] })
          queryClient.invalidateQueries({ queryKey: ['company-type'] })
        }}
      />
    </div>
  )
}

/* ─── Create dialog ─── */

function CreateCompanyTypeDialog({
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
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: {
      name: string
      code?: string
      description?: string
      status: string
    }) => apiPost<CompanyType>('/company-types', body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setCode('')
      setDescription('')
      setStatus('active')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setCode('')
      setDescription('')
      setStatus('active')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New company type</DialogTitle>
          <DialogDescription>Add a new company type.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              code: code.trim() || undefined,
              description: description.trim() || undefined,
              status,
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="ct-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="ct-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="ct-code" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Code
            </label>
            <input
              id="ct-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="ct-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Description
            </label>
            <textarea
              id="ct-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
            />
          </div>
          <div>
            <label htmlFor="ct-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Status
            </label>
            <select
              id="ct-status"
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

function CompanyTypeDetailDialog({
  typeId,
  open,
  onOpenChange,
  onEdit,
}: {
  typeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: item, isLoading } = useQuery({
    queryKey: ['company-type', typeId],
    queryFn: () => apiGet<CompanyType>(`/company-types/${typeId}`, opts),
    enabled: open && !!typeId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Company type details</DialogTitle>
          <DialogDescription>Details for the selected type.</DialogDescription>
        </DialogHeader>
        {isLoading || !item ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-[var(--muted)] animate-pulse" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={item.name} />
            <DetailRow label="Code" value={item.code} />
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

function EditCompanyTypeDialog({
  typeId,
  open,
  onOpenChange,
  onSuccess,
}: {
  typeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: item } = useQuery({
    queryKey: ['company-type', typeId],
    queryFn: () => apiGet<CompanyType>(`/company-types/${typeId}`, opts),
    enabled: open && !!typeId && !!opts.tenantId && !!opts.token,
  })

  if (item && !loaded) {
    setName(item.name)
    setCode(item.code ?? '')
    setDescription(item.description ?? '')
    setStatus(item.status)
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: {
      name: string
      code?: string
      description?: string
      status: string
    }) => apiPatch<CompanyType>(`/company-types/${typeId}`, body, opts),
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
          <DialogTitle>Edit company type</DialogTitle>
          <DialogDescription>Update company type information.</DialogDescription>
        </DialogHeader>
        {!item ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
                code: code.trim() || undefined,
                description: description.trim() || undefined,
                status,
              })
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="cte-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name *
              </label>
              <input
                id="cte-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="cte-code" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Code
              </label>
              <input
                id="cte-code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
              />
            </div>
            <div>
              <label htmlFor="cte-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Description
              </label>
              <textarea
                id="cte-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
              />
            </div>
            <div>
              <label htmlFor="cte-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Status
              </label>
              <select
                id="cte-status"
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
