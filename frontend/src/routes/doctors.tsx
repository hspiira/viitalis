import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap } from '#/lib/utils'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '#/components/ui/empty'
import { ListPagePagination, TableSkeleton } from '#/components/list-page'
import { Skeleton } from '#/components/ui/skeleton'
import { Stethoscope, Search, Plus, Building2, SquareArrowOutUpRight, MoreVertical, SquarePen, User } from 'lucide-react'

export const Route = createFileRoute('/doctors')({
  beforeLoad: () => requireAuthBeforeLoad('/doctors'),
  component: DoctorsPage,
})

interface Doctor {
  id: string
  tenant_id: string
  hospital_id: string
  name: string
  specialization: string | null
  reference: string | null
  date_of_birth: string | null
  address: string | null
  phone_home: string | null
  phone_mobile: string | null
  licence_no: string | null
  department: string | null
  doctor_category: string | null
  email: string | null
  website: string | null
  gender: string | null
  remarks: string | null
  service_charges: number | null
  channeling_charges: number | null
  referring_charges: number | null
}

interface Hospital {
  id: string
  name: string
  address: string | null
}

const LIMIT = 20

function DoctorsPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('')
  const [skip, setSkip] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [openActionsId, setOpenActionsId] = useState<string | null>(null)

  const params = new URLSearchParams({ skip: String(skip), limit: String(LIMIT) })
  if (hospitalFilter) params.set('hospital_id', hospitalFilter)

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['doctors', skip, LIMIT, hospitalFilter, opts.tenantId],
    queryFn: () => apiGet<Doctor[]>(`/doctors?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals-list', opts.tenantId],
    queryFn: () => apiGet<Hospital[]>(`/hospitals?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const hospitalById = buildIdToEntityMap(hospitals)
  const filteredItems = searchQuery.trim()
    ? items.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        (d.specialization || '').toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : items

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">
          Doctors
        </h1>
        <p className="text-[var(--foreground-muted)]">
          Sign in and select a tenant to manage doctors.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 min-h-0 h-full">
      {/* Tabs: Hospital Management | Doctor Management (visible when on Doctor Management) */}
      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <Link
          to="/hospitals"
          search={{ selected: null, tab: 'details' }}
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
        >
          <Building2 className="size-4 shrink-0" aria-hidden />
          Hospital Management
        </Link>
        <Link
          to="/doctors"
          className="flex items-center gap-2 border-b-2 border-[var(--primary)] bg-[var(--primary)]/10 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
        >
          <Stethoscope className="size-4 shrink-0" aria-hidden />
          Doctor Management
        </Link>
      </div>
      <div className="flex flex-nowrap items-center gap-2 border-b border-[var(--border)] py-2.5 text-sm">
        <div className="flex h-8 min-w-0 max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <input
            type="search"
            placeholder="Search doctors"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
            aria-label="Search doctors"
          />
        </div>
        <div className="flex h-8 w-[160px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
          <Building2 className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
          <select
            value={hospitalFilter}
            onChange={(e) => {
              setHospitalFilter(e.target.value)
              setSkip(0)
            }}
            className="min-w-0 flex-1 bg-transparent text-[var(--foreground)] focus:outline-none"
            aria-label="Hospital"
          >
            <option value="">All hospitals</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
        <div className="ml-auto flex shrink-0">
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add doctor
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
              <Stethoscope className="size-6" />
            </EmptyMedia>
            <EmptyTitle>No doctors</EmptyTitle>
            <EmptyDescription>
              No doctors match your filters. Try changing the filters or add a new doctor.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="secondary"
              onClick={() => {
                setHospitalFilter('')
                setSearchQuery('')
                setSkip(0)
                refetch()
              }}
            >
              Clear filters
            </Button>
            <Button onClick={() => setShowCreate(true)}>Add doctor</Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <User className="size-3.5" aria-hidden />
                      </span>
                      Name
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Stethoscope className="size-3.5" aria-hidden />
                      </span>
                      Specialization
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <Building2 className="size-3.5" aria-hidden />
                      </span>
                      Hospital
                    </span>
                  </th>
                  <th className="text-left py-2.5 px-3 w-[12rem] font-medium text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[var(--primary)]/15 text-[var(--primary)]">
                        <SquareArrowOutUpRight className="size-3.5" aria-hidden />
                      </span>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">
                      {d.name}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)]">
                      {d.specialization ?? '—'}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)] max-w-[200px] truncate" title={hospitalById[d.hospital_id]?.name ?? d.hospital_id}>
                      {hospitalById[d.hospital_id]?.name ?? d.hospital_id}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="relative flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-[var(--primary)] hover:opacity-80"
                          title="View"
                          aria-label="View doctor"
                          onClick={() => setDetailId(d.id)}
                        >
                          <SquareArrowOutUpRight className="size-4" aria-hidden />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-[var(--icon-muted)] hover:opacity-80"
                            onClick={() => setOpenActionsId((id) => (id === d.id ? null : d.id))}
                            title="More actions"
                            aria-label="More actions"
                            aria-expanded={openActionsId === d.id}
                          >
                            <MoreVertical className="size-4" aria-hidden />
                          </Button>
                          {openActionsId === d.id && (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                aria-hidden
                                onClick={() => setOpenActionsId(null)}
                              />
                              <div
                                className="absolute right-0 top-full z-50 mt-1 min-w-[10rem] rounded-md border border-[var(--border)] bg-[var(--card)] py-1 shadow-lg"
                                role="menu"
                              >
                                <button
                                  type="button"
                                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--secondary)]"
                                  role="menuitem"
                                  onClick={() => {
                                    setEditId(d.id)
                                    setOpenActionsId(null)
                                  }}
                                >
                                  <SquarePen className="size-3.5 shrink-0 text-[var(--icon-primary)]" aria-hidden />
                                  Edit
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
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

      <CreateDoctorDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        hospitals={hospitals}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['doctors'] })
        }}
      />

      <DoctorDetailDialog
        doctorId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        hospitalById={hospitalById}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />

      <EditDoctorDialog
        doctorId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        hospitals={hospitals}
        onSuccess={() => {
          setEditId(null)
          queryClient.invalidateQueries({ queryKey: ['doctors'] })
          queryClient.invalidateQueries({ queryKey: ['doctor'] })
        }}
      />
    </div>
  )
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

function CreateDoctorDialog({
  open,
  onOpenChange,
  hospitals,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  hospitals: Hospital[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const [hospitalId, setHospitalId] = useState('')
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [reference, setReference] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [phoneHome, setPhoneHome] = useState('')
  const [phoneMobile, setPhoneMobile] = useState('')
  const [licenceNo, setLicenceNo] = useState('')
  const [department, setDepartment] = useState('')
  const [doctorCategory, setDoctorCategory] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [gender, setGender] = useState('')
  const [remarks, setRemarks] = useState('')
  const [serviceCharges, setServiceCharges] = useState('')
  const [channelingCharges, setChannelingCharges] = useState('')
  const [referringCharges, setReferringCharges] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const toPayload = () => ({
    hospital_id: hospitalId.trim(),
    name: name.trim(),
    specialization: specialization.trim() || undefined,
    reference: reference.trim() || undefined,
    date_of_birth: dateOfBirth.trim() ? dateOfBirth.trim() : undefined,
    address: address.trim() || undefined,
    phone_home: phoneHome.trim() || undefined,
    phone_mobile: phoneMobile.trim() || undefined,
    licence_no: licenceNo.trim() || undefined,
    department: department.trim() || undefined,
    doctor_category: doctorCategory.trim() || undefined,
    email: email.trim() || undefined,
    website: website.trim() || undefined,
    gender: gender.trim() || undefined,
    remarks: remarks.trim() || undefined,
    service_charges: serviceCharges.trim() ? Number(serviceCharges) : undefined,
    channeling_charges: channelingCharges.trim() ? Number(channelingCharges) : undefined,
    referring_charges: referringCharges.trim() ? Number(referringCharges) : undefined,
  })

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Doctor>('/doctors', body, opts),
    onSuccess: () => {
      onSuccess()
      setHospitalId('')
      setName('')
      setSpecialization('')
      setReference('')
      setDateOfBirth('')
      setAddress('')
      setPhoneHome('')
      setPhoneMobile('')
      setLicenceNo('')
      setDepartment('')
      setDoctorCategory('')
      setEmail('')
      setWebsite('')
      setGender('')
      setRemarks('')
      setServiceCharges('')
      setChannelingCharges('')
      setReferringCharges('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setHospitalId('')
      setName('')
      setSpecialization('')
      setReference('')
      setDateOfBirth('')
      setAddress('')
      setPhoneHome('')
      setPhoneMobile('')
      setLicenceNo('')
      setDepartment('')
      setDoctorCategory('')
      setEmail('')
      setWebsite('')
      setGender('')
      setRemarks('')
      setServiceCharges('')
      setChannelingCharges('')
      setReferringCharges('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Stethoscope className="size-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">New doctor</h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Add a doctor linked to a hospital. Required: Hospital, Name.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!hospitalId.trim() || !name.trim()) return
            createMutation.mutate(toPayload())
          }}
          className="flex flex-col min-h-0 flex-1"
        >
          <div className="flex-1 overflow-y-auto px-6 py-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <FormField id="doc-hospital" label="Hospital *" icon={Building2}>
              <select id="doc-hospital" value={hospitalId} onChange={(e) => setHospitalId(e.target.value)} required className={inputBase}>
                <option value="">Select hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </FormField>
            <FormField id="doc-name" label="Name *" icon={User}>
              <input id="doc-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className={inputBase} />
            </FormField>
            <FormField id="doc-spec" label="Specialization" icon={Stethoscope}>
              <input id="doc-spec" type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. General practice" className={inputBase} />
            </FormField>
            <FormField id="doc-reference" label="Reference No" icon={User}>
              <input id="doc-reference" type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-dob" label="Date of birth" icon={User}>
              <input id="doc-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-gender" label="Gender" icon={User}>
              <select id="doc-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputBase}>
                <option value="">—</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </FormField>
            <FormField id="doc-address" label="Address" icon={Building2} className="sm:col-span-2">
              <textarea id="doc-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={1} className={inputBase + ' min-h-[2rem] py-1.5 resize-y'} />
            </FormField>
            <FormField id="doc-phone-home" label="Phone (home)" icon={User}>
              <input id="doc-phone-home" type="text" value={phoneHome} onChange={(e) => setPhoneHome(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-phone-mobile" label="Phone (mobile)" icon={User}>
              <input id="doc-phone-mobile" type="text" value={phoneMobile} onChange={(e) => setPhoneMobile(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-email" label="Email" icon={User}>
              <input id="doc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-website" label="Website" icon={User}>
              <input id="doc-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-licence" label="Licence No" icon={User}>
              <input id="doc-licence" type="text" value={licenceNo} onChange={(e) => setLicenceNo(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-department" label="Department" icon={Stethoscope}>
              <input id="doc-department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-category" label="Category" icon={User}>
              <input id="doc-category" type="text" value={doctorCategory} onChange={(e) => setDoctorCategory(e.target.value)} placeholder="e.g. Permanent, Visiting" className={inputBase} />
            </FormField>
            <FormField id="doc-service-charges" label="Service charges" icon={User}>
              <input id="doc-service-charges" type="number" step="0.01" min="0" value={serviceCharges} onChange={(e) => setServiceCharges(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-channeling" label="Channeling charges" icon={User}>
              <input id="doc-channeling" type="number" step="0.01" min="0" value={channelingCharges} onChange={(e) => setChannelingCharges(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-referring" label="Referring charges" icon={User}>
              <input id="doc-referring" type="number" step="0.01" min="0" value={referringCharges} onChange={(e) => setReferringCharges(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="doc-remarks" label="Remarks" icon={User} className="sm:col-span-2">
              <textarea id="doc-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={1} className={inputBase + ' min-h-[2rem] py-1.5 resize-y'} />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)] sm:col-span-2">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3 flex flex-row items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !hospitalId.trim() || !name.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Creating…' : 'Create doctor'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DoctorDetailDialog({
  doctorId,
  open,
  onOpenChange,
  hospitalById,
  onEdit,
}: {
  doctorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hospitalById: Record<string, Hospital>
  onEdit: (id: string) => void
}) {
  const opts = useApi()
  const { data: doctor, isLoading } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => apiGet<Doctor>(`/doctors/${doctorId}`, opts),
    enabled: open && !!doctorId && !!opts.tenantId && !!opts.token,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden">
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Stethoscope className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Doctor details</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Details for the selected doctor.</p>
            </div>
          </div>
        </header>
        {isLoading || !doctor ? (
          <div className="px-6 py-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <div className="px-6 py-5 space-y-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            {[
              { icon: User, label: 'Name', value: doctor.name },
              { icon: Stethoscope, label: 'Specialization', value: doctor.specialization ?? '—' },
              { icon: Building2, label: 'Hospital', value: hospitalById[doctor.hospital_id]?.name ?? doctor.hospital_id },
              { icon: User, label: 'Reference', value: doctor.reference ?? '—' },
              { icon: User, label: 'Date of birth', value: doctor.date_of_birth ?? '—' },
              { icon: User, label: 'Gender', value: doctor.gender ?? '—' },
              { icon: User, label: 'Address', value: doctor.address ?? '—', fullWidth: true },
              { icon: User, label: 'Phone (home)', value: doctor.phone_home ?? '—' },
              { icon: User, label: 'Phone (mobile)', value: doctor.phone_mobile ?? '—' },
              { icon: User, label: 'Email', value: doctor.email ?? '—' },
              { icon: User, label: 'Website', value: doctor.website ?? '—' },
              { icon: User, label: 'Licence No', value: doctor.licence_no ?? '—' },
              { icon: Stethoscope, label: 'Department', value: doctor.department ?? '—' },
              { icon: User, label: 'Category', value: doctor.doctor_category ?? '—' },
              { icon: User, label: 'Service charges', value: doctor.service_charges != null ? String(doctor.service_charges) : '—' },
              { icon: User, label: 'Channeling charges', value: doctor.channeling_charges != null ? String(doctor.channeling_charges) : '—' },
              { icon: User, label: 'Referring charges', value: doctor.referring_charges != null ? String(doctor.referring_charges) : '—' },
              { icon: User, label: 'Remarks', value: doctor.remarks ?? '—', fullWidth: true },
            ].map(({ icon: Icon, label, value, fullWidth }) => (
              <div
                key={label}
                className={`p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)] ${fullWidth ? 'sm:col-span-2' : ''}`}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">{label}:</span>
                  <span className="text-sm text-[var(--foreground)] break-words min-w-0">{value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {doctor && <Button onClick={() => onEdit(doctor.id)}><SquarePen className="size-3.5 mr-1" aria-hidden />Edit</Button>}
        </footer>
      </DialogContent>
    </Dialog>
  )
}

function EditDoctorDialog({
  doctorId,
  open,
  onOpenChange,
  hospitals,
  onSuccess,
}: {
  doctorId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  hospitals: Hospital[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [reference, setReference] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [phoneHome, setPhoneHome] = useState('')
  const [phoneMobile, setPhoneMobile] = useState('')
  const [licenceNo, setLicenceNo] = useState('')
  const [department, setDepartment] = useState('')
  const [doctorCategory, setDoctorCategory] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [gender, setGender] = useState('')
  const [remarks, setRemarks] = useState('')
  const [serviceCharges, setServiceCharges] = useState('')
  const [channelingCharges, setChannelingCharges] = useState('')
  const [referringCharges, setReferringCharges] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: doctor } = useQuery({
    queryKey: ['doctor', doctorId],
    queryFn: () => apiGet<Doctor>(`/doctors/${doctorId}`, opts),
    enabled: open && !!doctorId && !!opts.tenantId && !!opts.token,
  })

  if (doctor && !loaded) {
    setName(doctor.name)
    setSpecialization(doctor.specialization ?? '')
    setReference(doctor.reference ?? '')
    setDateOfBirth(doctor.date_of_birth ? doctor.date_of_birth.slice(0, 10) : '')
    setAddress(doctor.address ?? '')
    setPhoneHome(doctor.phone_home ?? '')
    setPhoneMobile(doctor.phone_mobile ?? '')
    setLicenceNo(doctor.licence_no ?? '')
    setDepartment(doctor.department ?? '')
    setDoctorCategory(doctor.doctor_category ?? '')
    setEmail(doctor.email ?? '')
    setWebsite(doctor.website ?? '')
    setGender(doctor.gender ?? '')
    setRemarks(doctor.remarks ?? '')
    setServiceCharges(doctor.service_charges != null ? String(doctor.service_charges) : '')
    setChannelingCharges(doctor.channeling_charges != null ? String(doctor.channeling_charges) : '')
    setReferringCharges(doctor.referring_charges != null ? String(doctor.referring_charges) : '')
    setLoaded(true)
  }

  const toPayload = () => ({
    name: name.trim(),
    specialization: specialization.trim() || null,
    reference: reference.trim() || null,
    date_of_birth: dateOfBirth.trim() || null,
    address: address.trim() || null,
    phone_home: phoneHome.trim() || null,
    phone_mobile: phoneMobile.trim() || null,
    licence_no: licenceNo.trim() || null,
    department: department.trim() || null,
    doctor_category: doctorCategory.trim() || null,
    email: email.trim() || null,
    website: website.trim() || null,
    gender: gender.trim() || null,
    remarks: remarks.trim() || null,
    service_charges: serviceCharges.trim() ? Number(serviceCharges) : null,
    channeling_charges: channelingCharges.trim() ? Number(channelingCharges) : null,
    referring_charges: referringCharges.trim() ? Number(referringCharges) : null,
  })

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPatch<Doctor>(`/doctors/${doctorId}`, body, opts),
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
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Stethoscope className="size-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">Edit doctor</h2>
              <p className="text-xs text-[var(--foreground-muted)] mt-0.5">Update doctor details. Hospital cannot be changed.</p>
            </div>
          </div>
        </header>
        {!doctor ? (
          <div className="px-6 py-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              updateMutation.mutate(toPayload())
            }}
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="flex-1 overflow-y-auto px-6 py-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <FormField id="doc-edit-hospital" label="Hospital" icon={Building2}>
                <input
                  id="doc-edit-hospital"
                  type="text"
                  value={hospitals.find((h) => h.id === doctor.hospital_id)?.name ?? doctor.hospital_id}
                  readOnly
                  className={inputBase + ' opacity-70 cursor-not-allowed'}
                />
              </FormField>
              <FormField id="doc-edit-name" label="Name *" icon={User}>
                <input id="doc-edit-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" className={inputBase} />
              </FormField>
              <FormField id="doc-edit-spec" label="Specialization" icon={Stethoscope}>
                <input id="doc-edit-spec" type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. General practice" className={inputBase} />
              </FormField>
              <FormField id="doc-edit-reference" label="Reference No" icon={User}>
                <input id="doc-edit-reference" type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-dob" label="Date of birth" icon={User}>
                <input id="doc-edit-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-gender" label="Gender" icon={User}>
                <select id="doc-edit-gender" value={gender} onChange={(e) => setGender(e.target.value)} className={inputBase}>
                  <option value="">—</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </FormField>
              <FormField id="doc-edit-address" label="Address" icon={Building2} className="sm:col-span-2">
                <textarea id="doc-edit-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={1} className={inputBase + ' min-h-[2rem] py-1.5 resize-y'} />
              </FormField>
              <FormField id="doc-edit-phone-home" label="Phone (home)" icon={User}>
                <input id="doc-edit-phone-home" type="text" value={phoneHome} onChange={(e) => setPhoneHome(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-phone-mobile" label="Phone (mobile)" icon={User}>
                <input id="doc-edit-phone-mobile" type="text" value={phoneMobile} onChange={(e) => setPhoneMobile(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-email" label="Email" icon={User}>
                <input id="doc-edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-website" label="Website" icon={User}>
                <input id="doc-edit-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-licence" label="Licence No" icon={User}>
                <input id="doc-edit-licence" type="text" value={licenceNo} onChange={(e) => setLicenceNo(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-department" label="Department" icon={Stethoscope}>
                <input id="doc-edit-department" type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-category" label="Category" icon={User}>
                <input id="doc-edit-category" type="text" value={doctorCategory} onChange={(e) => setDoctorCategory(e.target.value)} placeholder="e.g. Permanent, Visiting" className={inputBase} />
              </FormField>
              <FormField id="doc-edit-service-charges" label="Service charges" icon={User}>
                <input id="doc-edit-service-charges" type="number" step="0.01" min="0" value={serviceCharges} onChange={(e) => setServiceCharges(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-channeling" label="Channeling charges" icon={User}>
                <input id="doc-edit-channeling" type="number" step="0.01" min="0" value={channelingCharges} onChange={(e) => setChannelingCharges(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-referring" label="Referring charges" icon={User}>
                <input id="doc-edit-referring" type="number" step="0.01" min="0" value={referringCharges} onChange={(e) => setReferringCharges(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="doc-edit-remarks" label="Remarks" icon={User} className="sm:col-span-2">
                <textarea id="doc-edit-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={1} className={inputBase + ' min-h-[2rem] py-1.5 resize-y'} />
              </FormField>
              {submitError && <p className="text-sm text-[var(--destructive)] sm:col-span-2">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-3 flex flex-row items-center justify-end gap-2 shrink-0">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending || !name.trim()} className="min-w-[100px]">
                {updateMutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </footer>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
