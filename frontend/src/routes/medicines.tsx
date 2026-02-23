import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
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
import { TablePagination, TableSkeleton } from '#/components/list-page'
import { Pill, Search, Plus, Upload } from 'lucide-react'

export const Route = createFileRoute('/medicines')({
  beforeLoad: () => requireAuthBeforeLoad('/medicines'),
  component: MedicinesPage,
})

interface CatalogItem {
  id: string
  tenant_id: string
  name: string
  code: string | null
  remarks: string | null
}

const LIMIT = 50

function MedicinesPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showUpload, setShowUpload] = useState(false)

  const params = new URLSearchParams({ skip: String(skip), limit: String(LIMIT) })

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['medicines', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<CatalogItem[]>(`/medicines?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = searchQuery.trim()
    ? items.filter(
        (r) =>
          r.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (r.code || '').toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
          (r.remarks || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Medicines
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage the medicines catalog.
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
            placeholder="Search medicines"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search medicines"
          />
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowUpload(true)}
          >
            <Upload className="size-3.5 mr-1" aria-hidden />
            Bulk upload
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add item
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
              <Pill className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No medicines</EmptyTitle>
            <EmptyDescription>
              No medicines match your search. Add one or bulk upload.
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
            <Button onClick={() => setShowUpload(true)}>Bulk upload</Button>
            <Button onClick={() => setShowCreate(true)}>Add item</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-1.5 px-3 font-medium text-[var(--foreground-muted)]">
                    Name
                  </th>
                  <th className="text-left py-1.5 px-3 font-medium text-[var(--foreground-muted)] w-32">
                    Code
                  </th>
                  <th className="text-left py-1.5 px-3 font-medium text-[var(--foreground-muted)]">
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r, index) => (
                  <tr
                    key={r.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      index % 2 === 0 ? 'bg-[var(--muted)]/10' : ''
                    }`}
                  >
                    <td className="py-1.5 px-3 font-medium text-[var(--foreground)] min-w-0 max-w-[400px] truncate" title={r.name}>
                      {r.name}
                    </td>
                    <td className="py-1.5 px-3 text-[var(--foreground-muted)] truncate" title={r.code ?? undefined}>
                      {r.code ?? '—'}
                    </td>
                    <td className="py-1.5 px-3 text-[var(--foreground-muted)] min-w-0 max-w-[280px] truncate" title={r.remarks ?? undefined}>
                      {r.remarks ?? '—'}
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

      <CreateMedicineDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['medicines'] })
        }}
      />

      <BulkUploadMedicinesDialog
        open={showUpload}
        onOpenChange={(open) => !open && setShowUpload(false)}
        onSuccess={() => {
          setShowUpload(false)
          queryClient.invalidateQueries({ queryKey: ['medicines'] })
        }}
      />
    </div>
  )
}

function CreateMedicineDialog({
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
  const [remarks, setRemarks] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; code?: string; remarks?: string }) =>
      apiPost<CatalogItem>('/medicines', body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setCode('')
      setRemarks('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setCode('')
      setRemarks('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New medicine</DialogTitle>
          <DialogDescription>Add a medicine to the catalog.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              code: code.trim() || undefined,
              remarks: remarks.trim() || undefined,
            })
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="med-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="med-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="med-code" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Code
            </label>
            <input
              id="med-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="med-remarks" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Remarks
            </label>
            <input
              id="med-remarks"
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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

function BulkUploadMedicinesDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [uploadJson, setUploadJson] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (body: { items: Array<{ name: string; code?: string }> }) =>
      apiPost<{
        created: number
        failed: number
        errors: Array<{ row: number; message: string }>
      }>('/medicines/upload', body, opts),
    onSuccess: (data) => {
      setUploadJson('')
      setUploadError(null)
      queryClient.invalidateQueries({ queryKey: ['medicines'] })
      if (data.created > 0 || data.failed > 0) onSuccess()
    },
    onError: (err) => setUploadError(getApiErrorDetail(err)),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUploadError(null)
    try {
      const parsed = JSON.parse(uploadJson) as { name: string; code?: string }[]
      if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 500)
        throw new Error('Upload must be a JSON array of 1–500 items')
      uploadMutation.mutate({
        items: parsed.map((r) => ({
          name: String(r.name ?? '').trim(),
          code: r.code ? String(r.code).trim() : undefined,
          remarks: r.remarks ? String(r.remarks).trim() : undefined,
        })),
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setUploadJson('')
      setUploadError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload medicines</DialogTitle>
          <DialogDescription>
            JSON array of objects with name (and optional code for import). Max 500 items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={uploadJson}
            onChange={(e) => setUploadJson(e.target.value)}
            rows={8}
            placeholder='[{"name":"Paracetamol 500mg"}]'
            className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm font-mono text-[var(--foreground)] rounded-md resize-y"
          />
          {(uploadError || uploadMutation.isError) && (
            <p className="text-sm text-[var(--destructive)]">
              {uploadError ?? getApiErrorDetail(uploadMutation.error as { detail?: string })}
            </p>
          )}
          {uploadMutation.isSuccess && uploadMutation.data && (
            <p className="text-sm text-[var(--foreground-muted)]">
              Created: {uploadMutation.data.created}, Failed: {uploadMutation.data.failed}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
