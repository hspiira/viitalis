import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { formatCurrency } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'

export interface Scheme {
  id: string
  tenant_id: string
  company_id: string
  code: string | null
  name: string
  description: string | null
  limit_value: number | null
  begin_date: string | null
  end_date: string | null
  termination_date: string | null
  status: string
}

export interface CompanyRef {
  id: string
  name: string
}

export function StatusBadge({ status }: { status: string }) {
  const s = (status || '').toLowerCase()
  const color =
    s === 'active'
      ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40'
      : s === 'terminated'
        ? 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/40'
        : 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      <span
        className={`size-1.5 rounded-full ${
          s === 'active' ? 'bg-emerald-500' : s === 'terminated' ? 'bg-red-500' : 'bg-gray-400'
        }`}
      />
      {status || '—'}
    </span>
  )
}

/* ─── Form ─── */

interface SchemeFormFields {
  company_id: string
  name: string
  description: string
  limit_value: string
  begin_date: string
  end_date: string
  status: string
}

const EMPTY_FORM: SchemeFormFields = {
  company_id: '',
  name: '',
  description: '',
  limit_value: '',
  begin_date: '',
  end_date: '',
  status: 'active',
}

function useSchemeForm(initial: SchemeFormFields = EMPTY_FORM) {
  const [fields, setFields] = useState<SchemeFormFields>(initial)

  const update = (key: keyof SchemeFormFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const reset = (values: SchemeFormFields = EMPTY_FORM) => setFields(values)

  const toPayload = () => ({
    company_id: fields.company_id,
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    limit_value: fields.limit_value ? Number(fields.limit_value) : null,
    begin_date: fields.begin_date || null,
    end_date: fields.end_date || null,
    status: fields.status,
  })

  return { fields, update, reset, toPayload }
}

function SchemeFormBody({
  fields,
  update,
  companies,
  hideCompany,
  showStatus = true,
}: {
  fields: SchemeFormFields
  update: (key: keyof SchemeFormFields, value: string) => void
  companies: CompanyRef[]
  hideCompany?: boolean
  showStatus?: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {!hideCompany && (
        <div className="col-span-2">
          <label htmlFor="sch-company" className="block text-sm text-[var(--foreground-muted)] mb-1">
            Company *
          </label>
          <select
            id="sch-company"
            value={fields.company_id}
            onChange={(e) => update('company_id', e.target.value)}
            required
            className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
          >
            <option value="">— Select company —</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="col-span-2">
        <label htmlFor="sch-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Name *
        </label>
        <input
          id="sch-name"
          type="text"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          required
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div className="col-span-2">
        <label htmlFor="sch-desc" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Description
        </label>
        <textarea
          id="sch-desc"
          value={fields.description}
          onChange={(e) => update('description', e.target.value)}
          rows={2}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
        />
      </div>
      <div>
        <label htmlFor="sch-limit" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Limit value
        </label>
        <input
          id="sch-limit"
          type="number"
          min="0"
          step="0.01"
          value={fields.limit_value}
          onChange={(e) => update('limit_value', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      {showStatus && (
        <div>
          <label htmlFor="sch-status" className="block text-sm text-[var(--foreground-muted)] mb-1">
            Status
          </label>
          <select
            id="sch-status"
            value={fields.status}
            onChange={(e) => update('status', e.target.value)}
            className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
          >
            <option value="active">Active</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      )}
      <div>
        <label htmlFor="sch-begin" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Begin date
        </label>
        <input
          id="sch-begin"
          type="date"
          value={fields.begin_date}
          onChange={(e) => update('begin_date', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="sch-end" className="block text-sm text-[var(--foreground-muted)] mb-1">
          End date
        </label>
        <input
          id="sch-end"
          type="date"
          value={fields.end_date}
          onChange={(e) => update('end_date', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
    </div>
  )
}

/* ─── Create dialog ─── */

export function CreateSchemeDialog({
  open,
  onOpenChange,
  companies,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyRef[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useSchemeForm()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPost<Scheme>('/schemes', body, opts),
    onSuccess: () => {
      onSuccess()
      form.reset()
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New scheme</DialogTitle>
          <DialogDescription>Fill in the details to create a scheme.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form.toPayload())
          }}
          className="space-y-4"
        >
          <SchemeFormBody fields={form.fields} update={form.update} companies={companies} showStatus={false} />
          {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !form.fields.name.trim() || !form.fields.company_id}
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit dialog ─── */

export function EditSchemeDialog({
  schemeId,
  open,
  onOpenChange,
  companies,
  onSuccess,
}: {
  schemeId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companies: CompanyRef[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useSchemeForm()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: scheme } = useQuery({
    queryKey: ['scheme', schemeId],
    queryFn: () => apiGet<Scheme>(`/schemes/${schemeId}`, opts),
    enabled: open && !!schemeId && !!opts.tenantId && !!opts.token,
  })

  if (scheme && !loaded) {
    form.reset({
      company_id: scheme.company_id,
      name: scheme.name,
      description: scheme.description ?? '',
      limit_value: scheme.limit_value != null ? String(scheme.limit_value) : '',
      begin_date: scheme.begin_date ?? '',
      end_date: scheme.end_date ?? '',
      status: scheme.status,
    })
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPatch<Scheme>(`/schemes/${schemeId}`, body, opts),
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit scheme</DialogTitle>
          <DialogDescription>Update scheme information.</DialogDescription>
        </DialogHeader>
        {!scheme ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate(form.toPayload())
            }}
            className="space-y-4"
          >
            <SchemeFormBody
              fields={form.fields}
              update={form.update}
              companies={companies}
              hideCompany
            />
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending || !form.fields.name.trim()}>
                {updateMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
