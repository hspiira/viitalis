import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useMemo } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap } from '#/lib/utils'
import { useRowSelection, isAllSelected } from '#/hooks/use-row-selection'
import { Button } from '#/components/ui/button'
import { Checkbox } from '#/components/ui/checkbox'
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
import { Skeleton } from '#/components/ui/skeleton'
import { DetailRow, ListPagePagination, TableSkeleton } from '#/components/list-page'
import {
  Building2,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MoreHorizontal,
  Globe,
  Trash2,
} from 'lucide-react'

export const Route = createFileRoute('/companies')({
  beforeLoad: () => requireAuthBeforeLoad('/companies'),
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

interface CompanyType {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

const LIMIT = 20

function CompaniesPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [typeFilter, setTypeFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [detailCompanyId, setDetailCompanyId] = useState<string | null>(null)
  const [editCompanyId, setEditCompanyId] = useState<string | null>(null)
  const { selectedIds, toggleAll, toggleOne, clearSelection } = useRowSelection()

  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(LIMIT),
  })

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['companies', skip, LIMIT, opts.tenantId],
    queryFn: () => apiGet<Company[]>(`/companies?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: companyTypes = [] } = useQuery({
    queryKey: ['company-types', opts.tenantId],
    queryFn: () => apiGet<CompanyType[]>('/company-types?skip=0&limit=500', opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const companyTypeById = useMemo(
    () => buildIdToEntityMap(companyTypes),
    [companyTypes],
  )

  const filteredItems = useMemo(() => {
    let result = items
    if (typeFilter) {
      result = result.filter((c) => String(c.company_type) === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.contact_person || '').toLowerCase().includes(q) ||
          (c.email || '').toLowerCase().includes(q),
      )
    }
    return result
  }, [items, typeFilter, searchQuery])

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Companies</h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage companies.
        </p>
      </div>
    )
  }

  const itemIds = useMemo(() => filteredItems.map((c) => c.id), [filteredItems])
  const allSelected = isAllSelected(itemIds, selectedIds)
  const someSelected = selectedIds.size > 0
  const handleToggleAll = () => toggleAll(itemIds)

  return (
    <div className="flex flex-col gap-0">
      {/* Toolbar */}
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-0 max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Search companies"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search companies"
          />
        </div>
        <div className="flex h-8 w-[150px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Filter className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Company type"
          >
            <option value="">All types</option>
            {companyTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Sort">
            <ArrowUpDown className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
            <MoreHorizontal className="size-3.5" />
          </Button>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add company
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
        <CompanyTableSkeleton />
      ) : filteredItems.length === 0 ? (
        <Empty className="border border-[var(--border)] rounded-lg py-8 shadow-none mt-2">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2 className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No companies</EmptyTitle>
            <EmptyDescription>
              No companies match your filters. Try changing the filters or add a new company.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              onClick={() => {
                setTypeFilter('')
                setSearchQuery('')
                setSkip(0)
                refetch()
              }}
            >
              Clear filters
            </Button>
            <Button onClick={() => setShowCreate(true)}>Add company</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="w-10 py-2.5 pl-3 pr-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleToggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Contact</th>
                  <th className="text-left py-2.5 px-3 font-medium">Email</th>
                  <th className="text-left py-2.5 px-3 font-medium">Phone</th>
                  <th className="text-left py-2.5 px-3 font-medium">Type</th>
                  <th className="text-left py-2.5 px-3 font-medium">Website</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((company) => (
                  <tr
                    key={company.id}
                    className={`border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20 ${
                      selectedIds.has(company.id) ? 'bg-[var(--muted)]/40' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-3 pr-2">
                      <Checkbox
                        checked={selectedIds.has(company.id)}
                        onCheckedChange={() => toggleOne(company.id)}
                        aria-label={`Select ${company.name}`}
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {company.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.contact_person ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.email ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.phone ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.company_type != null
                        ? companyTypeById[String(company.company_type)]?.name ?? '—'
                        : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {company.website ? (
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[var(--primary)] hover:underline truncate max-w-[130px]"
                        >
                          <Globe className="size-3 shrink-0" aria-hidden />
                          <span className="truncate">{company.website.replace(/^https?:\/\//, '')}</span>
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailCompanyId(company.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {someSelected && (
            <div className="flex items-center gap-3 border-t border-[var(--border)] bg-[var(--muted)]/30 px-4 py-2.5 text-sm">
              <span className="text-[var(--foreground-muted)]">
                {selectedIds.size} compan{selectedIds.size !== 1 ? 'ies' : 'y'} selected
              </span>
              <Button variant="destructive" size="sm">
                <Trash2 className="size-3.5 mr-1" aria-hidden />
                Delete
              </Button>
              <Button variant="ghost" size="sm" onClick={clearSelection}>
                Clear selection
              </Button>
            </div>
          )}

          <ListPagePagination
            skip={skip}
            limit={LIMIT}
            currentPageSize={items.length}
            onPrevious={() => setSkip((s) => Math.max(0, s - LIMIT))}
            onNext={() => items.length === LIMIT && setSkip((s) => s + LIMIT)}
          />
        </>
      )}

      <CreateCompanyDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        companyTypes={companyTypes}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['companies'] })
        }}
      />

      <CompanyDetailDialog
        companyId={detailCompanyId ?? ''}
        open={!!detailCompanyId}
        onOpenChange={(open) => !open && setDetailCompanyId(null)}
        companyTypeById={companyTypeById}
        onEdit={(id) => {
          setDetailCompanyId(null)
          setEditCompanyId(id)
        }}
      />

      <EditCompanyDialog
        companyId={editCompanyId ?? ''}
        open={!!editCompanyId}
        onOpenChange={(open) => !open && setEditCompanyId(null)}
        companyTypes={companyTypes}
        onSuccess={() => {
          setEditCompanyId(null)
          queryClient.invalidateQueries({ queryKey: ['companies'] })
          queryClient.invalidateQueries({ queryKey: ['company'] })
        }}
      />
    </div>
  )
}

function CompanyTableSkeleton() {
  return <TableSkeleton columns={7} withCheckbox rows={5} />
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
    <div className="grid grid-cols-2 gap-4">
      <div className="col-span-2">
        <label htmlFor="cmp-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Name *
        </label>
        <input
          id="cmp-name"
          type="text"
          value={fields.name}
          onChange={(e) => update('name', e.target.value)}
          required
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-contact" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Contact person
        </label>
        <input
          id="cmp-contact"
          type="text"
          value={fields.contact_person}
          onChange={(e) => update('contact_person', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-email" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Email
        </label>
        <input
          id="cmp-email"
          type="email"
          value={fields.email}
          onChange={(e) => update('email', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-phone" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Phone
        </label>
        <input
          id="cmp-phone"
          type="text"
          value={fields.phone}
          onChange={(e) => update('phone', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-type" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Company type
        </label>
        <select
          id="cmp-type"
          value={fields.company_type}
          onChange={(e) => update('company_type', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        >
          <option value="">— None —</option>
          {companyTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-2">
        <label htmlFor="cmp-address" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Address
        </label>
        <input
          id="cmp-address"
          type="text"
          value={fields.address}
          onChange={(e) => update('address', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-location" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Location
        </label>
        <input
          id="cmp-location"
          type="text"
          value={fields.location}
          onChange={(e) => update('location', e.target.value)}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div>
        <label htmlFor="cmp-website" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Website
        </label>
        <input
          id="cmp-website"
          type="url"
          value={fields.website}
          onChange={(e) => update('website', e.target.value)}
          placeholder="https://"
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
        />
      </div>
      <div className="col-span-2">
        <label htmlFor="cmp-remarks" className="block text-sm text-[var(--foreground-muted)] mb-1">
          Remarks
        </label>
        <textarea
          id="cmp-remarks"
          value={fields.remarks}
          onChange={(e) => update('remarks', e.target.value)}
          rows={2}
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md resize-y"
        />
      </div>
    </div>
  )
}

function CreateCompanyDialog({
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New company</DialogTitle>
          <DialogDescription>Fill in the details to create a company.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate(form.toPayload())
          }}
          className="space-y-4"
        >
          <CompanyFormBody fields={form.fields} update={form.update} companyTypes={companyTypes} />
          {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !form.fields.name.trim()}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Company detail dialog ─── */

function CompanyDetailDialog({
  companyId,
  open,
  onOpenChange,
  companyTypeById,
  onEdit,
}: {
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  companyTypeById: Record<string, CompanyType>
  onEdit: (id: string) => void
}) {
  const opts = useApi()

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => apiGet<Company>(`/companies/${companyId}`, opts),
    enabled: open && !!companyId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Company details</DialogTitle>
          <DialogDescription>Details for the selected company.</DialogDescription>
        </DialogHeader>
        {isLoading || !company ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm py-2">
            <DetailRow label="Name" value={company.name} />
            <DetailRow label="Contact" value={company.contact_person} />
            <DetailRow label="Email" value={company.email} />
            <DetailRow label="Phone" value={company.phone} />
            <DetailRow label="Address" value={company.address} />
            <DetailRow label="Location" value={company.location} />
            <DetailRow
              label="Type"
              value={
                company.company_type != null
                  ? companyTypeById[String(company.company_type)]?.name ?? '—'
                  : null
              }
            />
            <DetailRow label="Website" value={company.website} />
            <DetailRow label="Remarks" value={company.remarks} />
          </dl>
        )}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {company && (
            <Button onClick={() => onEdit(company.id)}>Edit</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit company dialog ─── */

function EditCompanyDialog({
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit company</DialogTitle>
          <DialogDescription>Update company information.</DialogDescription>
        </DialogHeader>
        {!company ? (
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
            <CompanyFormBody fields={form.fields} update={form.update} companyTypes={companyTypes} />
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
