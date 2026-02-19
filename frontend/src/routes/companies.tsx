import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/companies')({
  component: CompaniesPage,
})

interface Company {
  id: string
  tenant_id: string
  name: string
  contact_person: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  remarks: string | null
  location: string | null
  district_id: number | null
  company_type: number | null
}

function CompaniesPage() {
  const token = getStoredToken()
  const tenantId = getTenantId()
  const [list, setList] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Company | null>(null)
  const [formName, setFormName] = useState('')
  const [formContact, setFormContact] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const opts = { token, tenantId: tenantId ?? undefined }

  async function load() {
    if (!token || !tenantId) return
    setLoading(true)
    setError(null)
    try {
      const data = await apiGet<Company[]>('/companies', opts)
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
    setFormContact('')
    setFormEmail('')
    setFormPhone('')
    setSubmitError(null)
    setShowForm(true)
  }

  function openEdit(c: Company) {
    setEditing(c)
    setFormName(c.name)
    setFormContact(c.contact_person ?? '')
    setFormEmail(c.email ?? '')
    setFormPhone(c.phone ?? '')
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
      if (editing) {
        await apiPatch(
          `/companies/${editing.id}`,
          {
            name: formName.trim(),
            contact_person: formContact.trim() || null,
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
          },
          opts
        )
      } else {
        await apiPost(
          '/companies',
          {
            name: formName.trim(),
            contact_person: formContact.trim() || null,
            email: formEmail.trim() || null,
            phone: formPhone.trim() || null,
          },
          opts
        )
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
    <div className="px-8 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">Companies</h1>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Add company
        </button>
      </div>

      {showForm && (
        <div className="mb-8 border border-[var(--border)] bg-[var(--card)] p-6">
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
            {editing ? 'Edit company' : 'New company'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="company-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name
              </label>
              <input
                id="company-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="company-contact" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Contact person
              </label>
              <input
                id="company-contact"
                type="text"
                value={formContact}
                onChange={(e) => setFormContact(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="company-email" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Email
              </label>
              <input
                id="company-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="company-phone" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Phone
              </label>
              <input
                id="company-phone"
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
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

      {error && (
        <p className="text-[var(--destructive)] mb-4">{error}</p>
      )}

      {loading ? (
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      ) : list.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">No companies yet. Add one to get started.</p>
      ) : (
        <div className="border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Contact</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Email</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Phone</th>
                <th className="w-20 p-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-[var(--border-subtle)]">
                  <td className="p-3 text-[var(--foreground)]">{c.name}</td>
                  <td className="p-3 text-[var(--foreground-muted)]">{c.contact_person ?? '—'}</td>
                  <td className="p-3 text-[var(--foreground-muted)]">{c.email ?? '—'}</td>
                  <td className="p-3 text-[var(--foreground-muted)]">{c.phone ?? '—'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
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
