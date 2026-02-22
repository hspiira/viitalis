import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Building2,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Layers,
} from 'lucide-react'

export const Route = createFileRoute('/companies')({
  beforeLoad: () => requireAuthBeforeLoad('/companies'),
  component: CompaniesLayout,
})

function CompaniesLayout() {
  return <Outlet />
}

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

interface CompanyType {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

/* ─── Create company dialog ─── */

interface CompanyFormFields {
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  website: string
  remarks: string
  location: string
  company_type: string
}

const EMPTY_FORM: CompanyFormFields = {
  name: '',
  contact_person: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  remarks: '',
  location: '',
  company_type: '',
}

function useCompanyForm(initial: CompanyFormFields = EMPTY_FORM) {
  const [fields, setFields] = useState<CompanyFormFields>(initial)

  const update = (key: keyof CompanyFormFields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const reset = (values: CompanyFormFields = EMPTY_FORM) => setFields(values)

  const toPayload = () => ({
    name: fields.name.trim(),
    contact_person: fields.contact_person.trim() || null,
    email: fields.email.trim() || null,
    phone: fields.phone.trim() || null,
    address: fields.address.trim() || null,
    website: fields.website.trim() || null,
    remarks: fields.remarks.trim() || null,
    location: fields.location.trim() || null,
    company_type: fields.company_type ? Number(fields.company_type) : null,
  })

  return { fields, update, reset, toPayload }
}

const inputBase =
  'w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent'
const labelBase = 'block text-sm font-medium text-[var(--foreground-muted)] mb-1.5'

function FormField({
  id,
  label,
  icon: Icon,
  children,
  className,
}: {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelBase}>
        <span className="inline-flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          {label}
        </span>
      </label>
      {children}
    </div>
  )
}

function CompanyFormBody({
  fields,
  update,
  companyTypes,
}: {
  fields: CompanyFormFields
  update: (key: keyof CompanyFormFields, value: string) => void
  companyTypes: CompanyType[]
}) {
  return (
    <div className="grid grid-cols-2 gap-5">
      <FormField id="cmp-name" label="Company name *" icon={Building2} className="col-span-2">
        <input
          id="cmp-name"
          type="text"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          required
          placeholder="e.g. Acme Health Ltd"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-contact" label="Contact person" icon={User}>
        <input
          id="cmp-contact"
          type="text"
          value={fields.contact_person}
          onChange={(e) => update('contact_person', e.target.value)}
          placeholder="Full name"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-type" label="Company type" icon={Layers}>
        <select
          id="cmp-type"
          value={fields.company_type}
          onChange={(e) => update('company_type', e.target.value)}
          className={inputBase}
        >
          <option value="">— None —</option>
          {companyTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id="cmp-email" label="Email" icon={Mail}>
        <input
          id="cmp-email"
          type="email"
          value={fields.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="contact@company.com"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-phone" label="Phone" icon={Phone}>
        <input
          id="cmp-phone"
          type="text"
          value={fields.phone}
          onChange={(e) => update('phone', e.target.value)}
          placeholder="+123 456 7890"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-address" label="Address" icon={MapPin} className="col-span-2">
        <textarea
          id="cmp-address"
          value={fields.address}
          onChange={(e) => update('address', e.target.value)}
          rows={3}
          placeholder="Street, city, postal code"
          className={inputBase + ' resize-y min-h-[80px]'}
        />
      </FormField>
      <FormField id="cmp-location" label="Location" icon={MapPin}>
        <input
          id="cmp-location"
          type="text"
          value={fields.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder="Area or region"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-website" label="Website" icon={Globe}>
        <input
          id="cmp-website"
          type="url"
          value={fields.website}
          onChange={(e) => update('website', e.target.value)}
          placeholder="https://"
          className={inputBase}
        />
      </FormField>
      <FormField id="cmp-remarks" label="Remarks" icon={FileText} className="col-span-2">
        <textarea
          id="cmp-remarks"
          value={fields.remarks}
          onChange={(e) => update('remarks', e.target.value)}
          rows={2}
          placeholder="Optional notes"
          className={inputBase + ' resize-y'}
        />
      </FormField>
    </div>
  )
}

export function CreateCompanyDialog({
  open,
  onOpenChange,
  companyTypes,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyTypes: CompanyType[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useCompanyForm()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPost<Company>('/companies', body, opts),
    onSuccess: () => {
      onSuccess()
      form.reset()
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">New company</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Add a new company to your tenant. Required fields are marked with *.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form.toPayload())
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <CompanyFormBody fields={form.fields} update={form.update} companyTypes={companyTypes} />
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !form.fields.name.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Creating…' : 'Create company'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}


/* ─── Edit company dialog ─── */

export function EditCompanyDialog({
  companyId,
  open,
  onOpenChange,
  companyTypes,
  onSuccess,
}: {
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companyTypes: CompanyType[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const form = useCompanyForm()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => apiGet<Company>(`/companies/${companyId}`, opts),
    enabled: open && !!companyId && !!opts.tenantId && !!opts.token,
  })

  if (company && !loaded) {
    form.reset({
      name: company.name,
      contact_person: company.contact_person ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      website: company.website ?? '',
      remarks: company.remarks ?? '',
      location: company.location ?? '',
      company_type: company.company_type != null ? String(company.company_type) : '',
    })
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: ReturnType<typeof form.toPayload>) =>
      apiPatch<Company>(`/companies/${companyId}`, body, opts),
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
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit company</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Update company information. Required fields are marked with *.</p>
            </div>
          </div>
        </header>
        {!company ? (
          <div className="px-6 py-5 space-y-3">
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
            className="flex flex-col"
          >
            <div className="flex-1 px-6 py-5 space-y-4">
              <CompanyFormBody fields={form.fields} update={form.update} companyTypes={companyTypes} />
              {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !form.fields.name.trim()}
                className="min-w-[100px]"
              >
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </footer>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
