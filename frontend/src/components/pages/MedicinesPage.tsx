import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

interface CatalogItem {
  id: string
  tenant_id: string
  name: string
  code: string | null
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

export function MedicinesPage() {
  const opts = useApiOpts()
  const queryClient = useQueryClient()
  const [skip, setSkip] = useState(0)
  const limit = 50
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [uploadJson, setUploadJson] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['medicines', skip, limit, opts.tenantId],
    queryFn: () =>
      apiGet<CatalogItem[]>(`/medicines?skip=${skip}&limit=${limit}`, opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: { name: string; code?: string }) =>
      apiPost<CatalogItem>('/medicines', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] })
      setShowForm(false)
      setName('')
      setCode('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (body: { items: Array<{ name: string; code?: string }> }) =>
      apiPost<{ created: number; failed: number; errors: Array<{ row: number; message: string }> }>(
        '/medicines/upload',
        body,
        opts
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] })
      setShowUpload(false)
      setUploadJson('')
    },
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim(), code: code.trim() || undefined })
  }

  const handleUpload = (e: React.FormEvent) => {
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
        })),
      })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }

  if (!opts.tenantId) {
    return (
      <div className="px-8 py-12 max-w-4xl">
        <h1 className="text-2xl font-semibold mb-2">Medicines</h1>
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to manage the medicine catalog.</p>
      </div>
    )
  }

  return (
    <div className="px-8 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Medicines</h1>
        <div className="flex gap-2">
          <button type="button" onClick={() => { setShowUpload(false); setShowForm((v) => !v) }} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium">
            {showForm ? 'Cancel' : 'Add item'}
          </button>
          <button type="button" onClick={() => { setShowForm(false); setShowUpload((v) => !v) }} className="border border-[var(--border)] px-4 py-2 text-sm">
            {showUpload ? 'Cancel' : 'Bulk upload'}
          </button>
        </div>
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3">
          <div><label className="block text-sm mb-1">Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border bg-[var(--background)] px-2.5 py-1.5" required /></div>
          <div><label className="block text-sm mb-1">Code</label><input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full border bg-[var(--background)] px-2.5 py-1.5" /></div>
          {createMutation.isError && <p className="text-sm text-[var(--destructive)]">{getApiErrorDetail(createMutation.error)}</p>}
          <button type="submit" disabled={createMutation.isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium disabled:opacity-50">{createMutation.isPending ? 'Saving…' : 'Save'}</button>
        </form>
      )}
      {showUpload && (
        <form onSubmit={handleUpload} className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3">
          <p className="text-sm text-[var(--foreground-muted)]">JSON array of objects with name and optional code. Max 500 items.</p>
          <textarea value={uploadJson} onChange={(e) => setUploadJson(e.target.value)} rows={8} className="w-full border bg-[var(--background)] px-2.5 py-1.5 font-mono text-sm" />
          {(uploadError || uploadMutation.isError) && <p className="text-sm text-[var(--destructive)]">{uploadError ?? getApiErrorDetail(uploadMutation.error)}</p>}
          {uploadMutation.isSuccess && uploadMutation.data && <p className="text-sm text-[var(--foreground-muted)]">Upload complete.</p>}
          <button type="submit" disabled={uploadMutation.isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium disabled:opacity-50">{uploadMutation.isPending ? 'Uploading…' : 'Upload'}</button>
        </form>
      )}
      {error && <p className="text-[var(--destructive)] mb-4">{getApiErrorDetail(error)}</p>}
      {isLoading ? <p className="text-[var(--foreground-muted)]">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)]"><th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Code</th></tr></thead>
            <tbody>{items.map((r) => <tr key={r.id} className="border-b border-[var(--border-subtle)]"><td className="py-2">{r.name}</td><td className="py-2">{r.code ?? '—'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
      {items.length >= limit && <div className="mt-4 flex gap-2"><button type="button" onClick={() => setSkip((s) => Math.max(0, s - limit))} disabled={skip === 0} className="text-sm disabled:opacity-50">Previous</button><button type="button" onClick={() => setSkip((s) => s + limit)} className="text-sm">Next</button></div>}
    </div>
  )
}
