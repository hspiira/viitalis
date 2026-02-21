import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

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

function CompanyGroupsPage() {
  const token = getStoredToken()
  const tenantId = getTenantId()
  const [list, setList] = useState<CompanyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CompanyGroup | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStatus, setFormStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const opts = { token, tenantId: tenantId ?? undefined }

  async function load() {
    if (!token || !tenantId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<CompanyGroup[]>('/company-groups', opts)
      setList(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(getApiErrorDetail(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [token, tenantId])

  function openCreate() {
    setEditing(null)
    setFormName('')
    setFormDescription('')
    setFormStatus('active')
    setSubmitError(null)
    setShowForm(true)
  }

  function openEdit(row: CompanyGroup) {
    setEditing(row)
    setFormName(row.name)
    setFormDescription(row.description ?? '')
    setFormStatus(row.status)
    setSubmitError(null)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setSubmitError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !tenantId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        status: formStatus,
      }
      if (editing) {
        await apiPatch(`/company-groups/${editing.id}`, payload, opts)
      } else {
        await apiPost('/company-groups', payload, opts)
      }
      closeForm()
      load()
    } catch (e) {
      setSubmitError(getApiErrorDetail(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Company groups</h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Add group
        </button>
      </div>

      {showForm && (
        <div className="mb-8 border border-[var(--border)] bg-[var(--card)] p-6 rounded-sm">
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
            {editing ? 'Edit company group' : 'New company group'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="cg-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name
              </label>
              <input
                id="cg-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="cg-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Description
              </label>
              <textarea
                id="cg-desc"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)] resize-y"
              />
            </div>
            <div>
              <label htmlFor="cg-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Status
              </label>
              <select
                id="cg-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            {submitError && (
              <p className="text-sm text-[var(--destructive)]">{submitError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="border border-[var(--border)] bg-[var(--secondary)] text-[var(--foreground)] px-4 py-2 text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {error && <p className="text-[var(--destructive)] mb-4">{error}</p>}

      {loading ? (
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">No company groups yet. Add one to get started.</p>
      ) : (
        <div className="border border-[var(--border)] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Description</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Status</th>
                <th className="w-20 p-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--secondary)]/50">
                  <td className="p-3 font-medium text-[var(--foreground)]">{row.name}</td>
                  <td className="p-3 text-[var(--foreground-muted)] max-w-xs truncate">{row.description ?? '—'}</td>
                  <td className="p-3 text-[var(--foreground-muted)]">{row.status}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openEdit(row)}
                      className="text-[var(--primary)] hover:underline"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
