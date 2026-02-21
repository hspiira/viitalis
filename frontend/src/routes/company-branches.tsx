import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useEffect, useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { getStoredToken, getTenantId } from '#/lib/auth-store'

export const Route = createFileRoute('/company-branches')({
  beforeLoad: () => requireAuthBeforeLoad('/company-branches'),
  component: CompanyBranchesPage,
})

interface Company {
  id: string
  name: string
}

interface Branch {
  id: string
  tenant_id: string
  company_id: string
  name: string
  address: string | null
  phone: string | null
}

function CompanyBranchesPage() {
  const token = getStoredToken()
  const tenantId = getTenantId()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [formName, setFormName] = useState('')
  const [formAddress, setFormAddress] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const opts = { token, tenantId: tenantId ?? undefined }

  async function loadCompanies() {
    if (!token || !tenantId) return
    setLoadingCompanies(true)
    setError(null)
    try {
      const data = await apiGet<{ id: string; name: string }[]>('/companies', opts)
      setCompanies(Array.isArray(data) ? data : [])
      if (Array.isArray(data) && data.length > 0 && !selectedCompanyId) {
        setSelectedCompanyId(data[0].id)
      }
    } catch (e) {
      setError(getApiErrorDetail(e))
    } finally {
      setLoadingCompanies(false)
    }
  }

  async function loadBranches() {
    if (!token || !tenantId || !selectedCompanyId) {
      setBranches([])
      return
    }
    setLoadingBranches(true)
    setError(null)
    try {
      const data = await apiGet<Branch[]>(
        `/companies/${selectedCompanyId}/branches`,
        opts
      )
      setBranches(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(getApiErrorDetail(e))
      setBranches([])
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    loadCompanies()
  }, [token, tenantId])

  useEffect(() => {
    if (selectedCompanyId) loadBranches()
    else setBranches([])
  }, [selectedCompanyId, token, tenantId])

  function openCreate() {
    if (!selectedCompanyId) return
    setEditing(null)
    setFormName('')
    setFormAddress('')
    setFormPhone('')
    setSubmitError(null)
    setShowForm(true)
  }

  function openEdit(b: Branch) {
    setEditing(b)
    setFormName(b.name)
    setFormAddress(b.address ?? '')
    setFormPhone(b.phone ?? '')
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
    if (!token || !tenantId || !selectedCompanyId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const payload = {
        name: formName.trim(),
        address: formAddress.trim() || null,
        phone: formPhone.trim() || null,
      }
      if (editing) {
        await apiPatch(
          `/companies/${selectedCompanyId}/branches/${editing.id}`,
          payload,
          opts
        )
      } else {
        await apiPost(
          `/companies/${selectedCompanyId}/branches`,
          payload,
          opts
        )
      }
      closeForm()
      loadBranches()
    } catch (e) {
      setSubmitError(getApiErrorDetail(e))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCompanyName =
    companies.find((c) => c.id === selectedCompanyId)?.name ?? ''

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Company branches
        </h1>
        <div className="flex items-center gap-3">
          <label htmlFor="branch-company" className="text-sm text-[var(--foreground-muted)]">
            Company
          </label>
          <select
            id="branch-company"
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)] min-w-[200px]"
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedCompanyId && (
            <button
              type="button"
              onClick={openCreate}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Add branch
            </button>
          )}
        </div>
      </div>

      {showForm && selectedCompanyId && (
        <div className="mb-8 border border-[var(--border)] bg-[var(--card)] p-6 rounded-sm">
          <h2 className="text-lg font-medium text-[var(--foreground)] mb-4">
            {editing ? 'Edit branch' : 'New branch'}
            {selectedCompanyName && (
              <span className="text-[var(--foreground-muted)] font-normal ml-2">
                — {selectedCompanyName}
              </span>
            )}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
            <div>
              <label htmlFor="br-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Name
              </label>
              <input
                id="br-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="br-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Address
              </label>
              <input
                id="br-address"
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="br-phone" className="block text-sm text-[var(--foreground-muted)] mb-1">
                Phone
              </label>
              <input
                id="br-phone"
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

      {error && <p className="text-[var(--destructive)] mb-4">{error}</p>}

      {!selectedCompanyId ? (
        <p className="text-[var(--foreground-muted)]">
          Select a company to view and manage its branches.
        </p>
      ) : loadingBranches ? (
        <p className="text-[var(--foreground-muted)]">Loading branches…</p>
      ) : branches.length === 0 ? (
        <p className="text-[var(--foreground-muted)]">
          No branches for this company yet. Add one to get started.
        </p>
      ) : (
        <div className="border border-[var(--border)] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--secondary)]">
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Name</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Address</th>
                <th className="text-left p-3 font-medium text-[var(--foreground)]">Phone</th>
                <th className="w-20 p-3" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-[var(--border-subtle)] hover:bg-[var(--secondary)]/50">
                  <td className="p-3 font-medium text-[var(--foreground)]">{b.name}</td>
                  <td className="p-3 text-[var(--foreground-muted)] max-w-xs truncate">{b.address ?? '—'}</td>
                  <td className="p-3 text-[var(--foreground-muted)]">{b.phone ?? '—'}</td>
                  <td className="p-3">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
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
