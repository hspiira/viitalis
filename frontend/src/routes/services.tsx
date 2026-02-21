import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/services')({
  beforeLoad: () => requireAuthBeforeLoad('/services'),
  component: ServicesPage,
})

interface CatalogItem {
  id: string
  tenant_id: string
  name: string
  code: string | null
}

function useApiOpts() {
  return { token: getStoredToken(), tenantId: getTenantId() }
}

function ServicesPage() {
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
    queryKey: ['services', skip, limit, opts.tenantId],
    queryFn: () =>
      apiGet<CatalogItem[]>(`/services?skip=${skip}&limit=${limit}`, opts),
    enabled: !!opts.tenantId,
  })

  const createMutation = useMutation({
    mutationFn: (body: { name: string; code?: string }) =>
      apiPost<CatalogItem>('/services', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
      setShowForm(false)
      setName('')
      setCode('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: (body: { items: Array<{ name: string; code?: string }> }) =>
      apiPost<{ created: number; failed: number; errors: Array<{ row: number; message: string }> }>(
        '/services/upload',
        body,
        opts
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] })
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
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Services</h1>
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to manage the services catalog.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Services</h1>
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
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]" required />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground-muted)] mb-1">Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)]" />
          </div>
          {createMutation.isError && <p className="text-sm text-[var(--destructive)]">{getApiErrorDetail(createMutation.error as { detail?: string })}</p>}
          <button type="submit" disabled={createMutation.isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium disabled:opacity-50">{createMutation.isPending ? 'Saving…' : 'Save'}</button>
        </form>
      )}
      {showUpload && (
        <form onSubmit={handleUpload} className="mb-6 p-4 border border-[var(--border)] bg-[var(--card)] space-y-3">
          <p className="text-sm text-[var(--foreground-muted)]">JSON array of objects with name and optional code. Max 500 items.</p>
          <textarea value={uploadJson} onChange={(e) => setUploadJson(e.target.value)} rows={8} className="w-full border border-[var(--input)] bg-[var(--background)] px-2.5 py-1.5 text-[var(--foreground)] font-mono text-sm" placeholder='[{"name":"Consultation","code":"CON01"}]' />
          {(uploadError || uploadMutation.isError) && <p className="text-sm text-[var(--destructive)]">{uploadError ?? getApiErrorDetail(uploadMutation.error as { detail?: string })}</p>}
          {uploadMutation.isSuccess && uploadMutation.data && <p className="text-sm text-[var(--foreground-muted)]">Created: {uploadMutation.data.created}, Failed: {uploadMutation.data.failed}</p>}
          <button type="submit" disabled={uploadMutation.isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium disabled:opacity-50">{uploadMutation.isPending ? 'Uploading…' : 'Upload'}</button>
        </form>
      )}
      {error && <p className="text-[var(--destructive)] mb-4">{getApiErrorDetail(error as { detail?: string })}</p>}
      {isLoading ? <p className="text-[var(--foreground-muted)]">Loading…</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[var(--border)]"><th className="text-left py-2 font-medium">Name</th><th className="text-left py-2 font-medium">Code</th></tr></thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-b border-[var(--border-subtle)]"><td className="py-2">{r.name}</td><td className="py-2">{r.code ?? '—'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length >= limit && <div className="mt-4 flex gap-2"><button type="button" onClick={() => setSkip((s) => Math.max(0, s - limit))} disabled={skip === 0} className="text-sm text-[var(--foreground-muted)] disabled:opacity-50">Previous</button><button type="button" onClick={() => setSkip((s) => s + limit)} className="text-sm text-[var(--foreground-muted)]">Next</button></div>}
    </div>
  )
}
