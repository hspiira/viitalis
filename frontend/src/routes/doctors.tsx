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
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { hospital_id: string; name: string; specialization?: string }) =>
      apiPost<Doctor>('/doctors', body, opts),
    onSuccess: () => {
      onSuccess()
      setHospitalId('')
      setName('')
      setSpecialization('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setHospitalId('')
      setName('')
      setSpecialization('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Stethoscope className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">New doctor</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Add a doctor linked to a hospital. Required fields are marked with *.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!hospitalId.trim() || !name.trim()) return
            createMutation.mutate({
              hospital_id: hospitalId.trim(),
              name: name.trim(),
              specialization: specialization.trim() || undefined,
            })
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <FormField id="doc-hospital" label="Hospital *" icon={Building2}>
              <select
                id="doc-hospital"
                value={hospitalId}
                onChange={(e) => setHospitalId(e.target.value)}
                required
                className={inputBase}
              >
                <option value="">Select hospital</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField id="doc-name" label="Name *" icon={User}>
              <input
                id="doc-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Full name"
                className={inputBase}
              />
            </FormField>
            <FormField id="doc-spec" label="Specialization" icon={Stethoscope}>
              <input
                id="doc-spec"
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="e.g. General practice"
                className={inputBase}
              />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
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
          <div className="px-6 py-5 space-y-3">
            <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                  <User className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">Name:</span>
                <span className="text-sm text-[var(--foreground)] break-words min-w-0">{doctor.name}</span>
              </div>
            </div>
            <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                  <Stethoscope className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">Specialization:</span>
                <span className="text-sm text-[var(--foreground)] break-words min-w-0">{doctor.specialization ?? '—'}</span>
              </div>
            </div>
            <div className="p-2.5 bg-[var(--muted)]/40 rounded-md border border-[var(--border)]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-[var(--primary)]/15 text-[var(--primary)]">
                  <Building2 className="size-3.5" aria-hidden />
                </span>
                <span className="text-xs font-medium text-[var(--foreground-muted)] shrink-0">Hospital:</span>
                <span className="text-sm text-[var(--foreground)] break-words min-w-0">{hospitalById[doctor.hospital_id]?.name ?? doctor.hospital_id}</span>
              </div>
            </div>
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
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; specialization?: string | null }) =>
      apiPatch<Doctor>(`/doctors/${doctorId}`, body, opts),
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
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Stethoscope className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit doctor</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Update doctor name and specialization. Hospital cannot be changed here.</p>
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
              updateMutation.mutate({
                name: name.trim(),
                specialization: specialization.trim() || null,
              })
            }}
            className="flex flex-col"
          >
            <div className="flex-1 px-6 py-5 space-y-4">
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
                <input
                  id="doc-edit-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Full name"
                  className={inputBase}
                />
              </FormField>
              <FormField id="doc-edit-spec" label="Specialization" icon={Stethoscope}>
                <input
                  id="doc-edit-spec"
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. General practice"
                  className={inputBase}
                />
              </FormField>
              {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
                Cancel
              </Button>
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
