import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef, useCallback } from 'react'
import { apiGet, apiPost, apiPatch, apiDelete, getApiErrorDetail } from '#/lib/api-client'
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
import { TablePagination, TableSkeleton } from '#/components/list-page'
import { Skeleton } from '#/components/ui/skeleton'
import {
  Building2,
  Search,
  Plus,
  MapPin,
  Stethoscope,
  Pill,
  Wrench,
  SquarePen,
  Trash2,
  LogOut,
} from 'lucide-react'

type HospitalDetailTab = 'details' | 'branches' | 'services' | 'medicines'
const HOSPITAL_DETAIL_TAB_IDS: HospitalDetailTab[] = ['details', 'branches', 'services', 'medicines']

export const Route = createFileRoute('/hospitals')({
  beforeLoad: () => requireAuthBeforeLoad('/hospitals'),
  validateSearch: (search: Record<string, unknown>) => ({
    selected:
      typeof search.selected === 'string' && search.selected.length > 0 ? search.selected : null,
    tab:
      typeof search.tab === 'string' && HOSPITAL_DETAIL_TAB_IDS.includes(search.tab as HospitalDetailTab)
        ? (search.tab as HospitalDetailTab)
        : ('details' as HospitalDetailTab),
  }),
  component: HospitalsPage,
})

interface Hospital {
  id: string
  tenant_id: string
  name: string
  address: string | null
  code: string | null
  reference: string | null
  contact_person: string | null
  phone: string | null
  email: string | null
  website: string | null
  remarks: string | null
  district_id: number | null
  outpatient_capacity: number | null
  inpatient_capacity: number | null
  out_or_in_patient: string | null
  dental: boolean | null
  status: string
}

interface HospitalBranch {
  id: string
  tenant_id: string
  hospital_id: string
  name: string
  address: string | null
  contact_person: string | null
  location: string | null
  remarks: string | null
}

interface HospitalMedicineRow {
  id: string
  tenant_id: string
  hospital_id: string
  medicine_id: string
  unit_price: number | string
  effective_date: string | null
  status: string
}

interface HospitalServiceRow {
  id: string
  tenant_id: string
  hospital_id: string
  service_id: string
  amount: number | string
  effective_date: string | null
  status: string
}

interface CatalogItem {
  id: string
  tenant_id: string
  name: string
  code: string | null
}

const HOSPITAL_DETAIL_TABS: { id: HospitalDetailTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'details', label: 'Hospital Details', icon: Building2 },
  { id: 'branches', label: 'Hospital Branch Details', icon: MapPin },
  { id: 'services', label: 'Services Offered', icon: Wrench },
  { id: 'medicines', label: 'Medicine Offered', icon: Pill },
]

const PAGE_SIZE = 10
const SEARCH_LIMIT = 500

function HospitalsPage() {
  const opts = useApi()
  const queryClient = useQueryClient()
  const navigate = useNavigate({ from: '/hospitals' })
  const { selected, tab: activeTab } = Route.useSearch()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const tableScrollRef = useRef<HTMLDivElement>(null)

  const isSearching = searchQuery.trim().length > 0
  const skip = isSearching ? 0 : page * PAGE_SIZE
  const limit = isSearching ? SEARCH_LIMIT : PAGE_SIZE
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) })
  const {
    data: items = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['hospitals', skip, limit, opts.tenantId],
    queryFn: () => apiGet<Hospital[]>(`/hospitals?${params}`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })

  const filteredItems = isSearching
    ? items.filter((h) => h.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : items
  const hasNextPage = !isSearching && items.length === PAGE_SIZE
  const hasPrevPage = !isSearching && page > 0

  const loadNextPage = useCallback(() => {
    if (hasNextPage) setPage((p) => p + 1)
  }, [hasNextPage])
  const loadPrevPage = useCallback(() => {
    if (hasPrevPage) setPage((p) => p - 1)
  }, [hasPrevPage])

  const onTableScroll = useCallback(() => {
    const el = tableScrollRef.current
    if (!el || isSearching || !hasNextPage || isFetching) return
    const { scrollTop, scrollHeight, clientHeight } = el
    if (scrollTop + clientHeight >= scrollHeight - 20) loadNextPage()
  }, [isSearching, hasNextPage, isFetching, loadNextPage])

  // Reset to first page when switching to/from search
  const onSearchChange = (value: string) => {
    setSearchQuery(value)
    if (!value.trim()) setPage(0)
  }

  const setSelected = (id: string | null) => {
    const next = id ?? null
    navigate({
      to: '/hospitals',
      search: (prev) => ({ ...prev, selected: next, tab: next ? activeTab : 'details' }),
    })
  }
  const setTab = (t: HospitalDetailTab) => {
    navigate({
      to: '/hospitals',
      search: (prev) => ({ ...prev, selected: selected ?? null, tab: t }),
    })
  }

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Hospital Management</h1>
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to manage hospitals.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0 min-h-0 h-full">
      {/* Top-level tabs: Hospital Management | Doctor Management */}
      <div className="flex shrink-0 border-b border-[var(--border)] bg-[var(--muted)]/30">
        <Link
          to="/hospitals"
          search={{ selected: null, tab: 'details' }}
          className="flex items-center gap-2 border-b-2 border-[var(--primary)] bg-[var(--primary)]/10 px-4 py-3 text-sm font-medium text-[var(--foreground)]"
        >
          <Building2 className="size-4 shrink-0" aria-hidden />
          Hospital Management
        </Link>
        <Link
          to="/doctors"
          className="flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]"
        >
          <Stethoscope className="size-4 shrink-0" aria-hidden />
          Doctor Management
        </Link>
      </div>

      {/* Hospital List (upper half) – horizontal padding from AppLayout only */}
      <div className="shrink-0 border-b border-[var(--border)] bg-[var(--muted)]/20 py-2">
        <h2 className="text-sm font-semibold text-[var(--foreground)] mb-2">Hospital List</h2>
        <div className="flex flex-nowrap items-center gap-2 mb-2">
          <div className="flex h-8 min-w-0 max-w-[220px] shrink-0 items-center gap-1.5 rounded-md border border-[var(--input)] bg-[var(--background)] px-2.5">
            <Search className="size-3.5 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            <input
              type="search"
              placeholder="Search hospitals"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
              aria-label="Search hospitals"
            />
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="h-8 bg-[var(--primary)] px-3 text-[var(--primary-foreground)]"
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            New
          </Button>
        </div>

        {error && (
          <div className="flex flex-col gap-2 py-2">
            <p className="text-sm text-[var(--destructive)]">{getApiErrorDetail(error as { detail?: string })}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {isLoading ? (
          <TableSkeleton columns={3} rows={5} />
        ) : filteredItems.length === 0 ? (
          <Empty className="border border-[var(--border)] rounded-lg py-6 shadow-none">
            <EmptyHeader>
              <EmptyMedia variant="icon"><Building2 className="size-6" /></EmptyMedia>
              <EmptyTitle>No hospitals</EmptyTitle>
              <EmptyDescription>No hospitals match your search. Add one to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="secondary" onClick={() => { setSearchQuery(''); refetch() }}>Clear search</Button>
              <Button onClick={() => setShowCreate(true)}>New</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <div
              ref={tableScrollRef}
              onScroll={onTableScroll}
              className="rounded-lg border border-[var(--border)] overflow-x-auto overflow-y-auto max-h-[280px]"
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--muted)]/50 border-b border-[var(--border)]">
                  <tr>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">NAME</th>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">REFERENCE</th>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">CONTACT</th>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">EMAIL</th>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">ADDRESS</th>
                    <th className="text-left py-2 px-3 font-medium text-[var(--foreground-muted)]">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((h) => (
                    <tr
                      key={h.id}
                      onClick={() => setSelected(String(h.id))}
                      className={`border-b border-[var(--border-subtle)] last:border-0 cursor-pointer hover:bg-[var(--muted)]/30 ${
                        selected === String(h.id) ? 'bg-[var(--primary)]/15' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-medium text-[var(--foreground)]">{h.name}</td>
                      <td className="py-2 px-3 text-[var(--foreground-muted)]">{h.reference ?? '—'}</td>
                      <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-[140px] truncate" title={[h.contact_person, h.phone].filter(Boolean).join(' · ') || undefined}>
                        {h.contact_person ?? h.phone ?? '—'}
                      </td>
                      <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-[160px] truncate" title={h.email ?? undefined}>{h.email ?? '—'}</td>
                      <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-xs truncate">{h.address ?? '—'}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                          (h.status || 'active').toLowerCase() === 'active'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                        }`}>
                          {(h.status || 'active').toLowerCase() === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isSearching && (
              <TablePagination
                skip={skip}
                limit={PAGE_SIZE}
                currentPageSize={items.length}
                onSkipChange={(s) => setPage(Math.floor(s / PAGE_SIZE))}
              />
            )}
          </>
        )}
      </div>

      {/* Hospital Details panel (lower half) – only when a hospital is selected */}
      {selected && (
        <HospitalDetailPanel
          key={selected}
          hospitalId={selected}
          activeTab={activeTab}
          onTabChange={setTab}
          onClearSelection={() => setSelected(null)}
          onDeleted={() => {
            setShowDeleteConfirm(false)
            setSelected(null)
            queryClient.invalidateQueries({ queryKey: ['hospitals'] })
          }}
          showDeleteConfirm={showDeleteConfirm}
          onShowDeleteConfirm={setShowDeleteConfirm}
        />
      )}

      {!selected && (
        <div className="flex-1 flex items-center justify-center border border-[var(--border)] rounded-lg bg-[var(--muted)]/10 mt-2">
          <p className="text-sm text-[var(--foreground-muted)]">Select a hospital from the list above to view and edit details.</p>
        </div>
      )}

      <CreateHospitalDialog
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        }}
      />
    </div>
  )
}

/* ─── Hospital Detail Panel (tabbed: Details, Branches, Services, Medicines) ─── */

function HospitalDetailPanel({
  hospitalId,
  activeTab,
  onTabChange,
  onClearSelection,
  onDeleted,
  showDeleteConfirm,
  onShowDeleteConfirm,
}: {
  hospitalId: string
  activeTab: HospitalDetailTab
  onTabChange: (t: HospitalDetailTab) => void
  onClearSelection: () => void
  onDeleted: () => void
  showDeleteConfirm: boolean
  onShowDeleteConfirm: (v: boolean) => void
}) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const { data: hospital, isLoading: hospitalLoading } = useQuery({
    queryKey: ['hospital', hospitalId],
    queryFn: () => apiGet<Hospital>(`/hospitals/${hospitalId}`, opts),
    enabled: !!hospitalId && !!opts.tenantId && !!opts.token,
  })

  return (
    <div className="flex flex-col flex-1 min-h-0 border-t border-[var(--border)]">
      <div className="shrink-0 flex border-b border-[var(--border)] bg-[var(--muted)]/20">
        {HOSPITAL_DETAIL_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === id
                ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--foreground)]'
                : 'border-transparent text-[var(--foreground-muted)] hover:bg-[var(--muted)]/50 hover:text-[var(--foreground)]'
            }`}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-4">
        {activeTab === 'details' && (
          <HospitalDetailsTab
            hospitalId={hospitalId}
            hospital={hospital}
            isLoading={hospitalLoading}
            onSaved={() => queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] })}
          />
        )}
        {activeTab === 'branches' && (
          <HospitalBranchesTab hospitalId={hospitalId} hospitalName={hospital?.name} />
        )}
        {activeTab === 'services' && (
          <HospitalServicesTab hospitalId={hospitalId} />
        )}
        {activeTab === 'medicines' && (
          <HospitalMedicinesTab hospitalId={hospitalId} />
        )}
      </div>

      <footer className="shrink-0 flex flex-wrap items-center gap-3 border-t border-[var(--border)] bg-[var(--muted)]/30 py-3">
        <Button variant="ghost" size="sm" onClick={onClearSelection}>
          <LogOut className="size-3.5 mr-1" aria-hidden />
          Exit
        </Button>
        {activeTab === 'details' && hospital && (
          <>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onShowDeleteConfirm(true)}
            >
              <Trash2 className="size-3.5 mr-1" aria-hidden />
              Delete
            </Button>
          </>
        )}
      </footer>

      {showDeleteConfirm && hospital && (
        <Dialog open={showDeleteConfirm} onOpenChange={onShowDeleteConfirm}>
          <DialogContent className="sm:max-w-md">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Delete hospital?</h3>
            <p className="text-sm text-[var(--foreground-muted)] mt-1">
              This will permanently delete &quot;{hospital.name}&quot;. This action cannot be undone. If the hospital has claims or linked data, deletion may fail.
            </p>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => onShowDeleteConfirm(false)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    await apiDelete(`/hospitals/${hospitalId}`, opts)
                    onDeleted()
                  } catch {
                    // Error toast or inline message could be added
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function HospitalDetailsTab({
  hospitalId,
  hospital,
  isLoading,
  onSaved,
}: {
  hospitalId: string
  hospital: Hospital | undefined
  isLoading: boolean
  onSaved: () => void
}) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [reference, setReference] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [remarks, setRemarks] = useState('')
  const [districtId, setDistrictId] = useState('')
  const [outpatientCapacity, setOutpatientCapacity] = useState('')
  const [inpatientCapacity, setInpatientCapacity] = useState('')
  const [outOrInPatient, setOutOrInPatient] = useState('')
  const [dental, setDental] = useState(false)
  const [status, setStatus] = useState('active')
  const [loaded, setLoaded] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  if (hospital && !loaded) {
    setName(hospital.name)
    setAddress(hospital.address ?? '')
    setReference(hospital.reference ?? '')
    setContactPerson(hospital.contact_person ?? '')
    setPhone(hospital.phone ?? '')
    setEmail(hospital.email ?? '')
    setWebsite(hospital.website ?? '')
    setRemarks(hospital.remarks ?? '')
    setDistrictId(hospital.district_id != null ? String(hospital.district_id) : '')
    setOutpatientCapacity(hospital.outpatient_capacity != null ? String(hospital.outpatient_capacity) : '')
    setInpatientCapacity(hospital.inpatient_capacity != null ? String(hospital.inpatient_capacity) : '')
    setOutOrInPatient(hospital.out_or_in_patient ?? '')
    setDental(hospital.dental ?? false)
    setStatus(hospital.status ?? 'active')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiPatch<Hospital>(`/hospitals/${hospitalId}`, body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] })
      queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] })
      onSaved()
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const toPayload = () => ({
    name: name.trim(),
    address: address.trim() || undefined,
    reference: reference.trim() || undefined,
    contact_person: contactPerson.trim() || undefined,
    phone: phone.trim() || undefined,
    email: email.trim() || undefined,
    website: website.trim() || undefined,
    remarks: remarks.trim() || undefined,
    district_id: districtId.trim() ? Number(districtId) : undefined,
    outpatient_capacity: outpatientCapacity.trim() ? Number(outpatientCapacity) : undefined,
    inpatient_capacity: inpatientCapacity.trim() ? Number(inpatientCapacity) : undefined,
    out_or_in_patient: outOrInPatient.trim() || undefined,
    dental,
    status: status.trim() || 'active',
  })

  if (isLoading || !hospital) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        updateMutation.mutate(toPayload())
      }}
      className="grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 lg:grid-cols-3"
    >
      <div className="space-y-2">
        <FormField id="hd-name" label="Hospital Name *" icon={Building2}>
          <input id="hd-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputBase} />
        </FormField>
        <FormField id="hd-reference" label="Reference No" icon={Building2}>
          <input id="hd-reference" type="text" value={reference} onChange={(e) => setReference(e.target.value)} className={inputBase} placeholder="e.g. SUSP_169" />
        </FormField>
        <FormField id="hd-contact" label="Contact Person" icon={Building2}>
          <input id="hd-contact" type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputBase} />
        </FormField>
        <FormField id="hd-address" label="Hospital Address" icon={MapPin}>
          <textarea id="hd-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputBase + ' resize-y min-h-[2.5rem] py-1.5'} />
        </FormField>
      </div>
      <div className="space-y-2">
        <FormField id="hd-outpatient" label="OutPatient Capacity" icon={Building2}>
          <input id="hd-outpatient" type="number" min={0} value={outpatientCapacity} onChange={(e) => setOutpatientCapacity(e.target.value)} className={inputBase} />
        </FormField>
        <FormField id="hd-inpatient" label="InPatient Capacity" icon={Building2}>
          <input id="hd-inpatient" type="number" min={0} value={inpatientCapacity} onChange={(e) => setInpatientCapacity(e.target.value)} className={inputBase} />
        </FormField>
        <FormField id="hd-district" label="District" icon={MapPin}>
          <input id="hd-district" type="text" value={districtId} onChange={(e) => setDistrictId(e.target.value)} className={inputBase} placeholder="District ID" />
        </FormField>
        <FormField id="hd-email" label="Email" icon={Building2}>
          <input id="hd-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputBase} />
        </FormField>
        <FormField id="hd-website" label="Website" icon={Building2}>
          <input id="hd-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputBase} placeholder="https://" />
        </FormField>
        <FormField id="hd-phone" label="Hospital Number" icon={Building2}>
          <input id="hd-phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputBase} />
        </FormField>
      </div>
      <div className="space-y-2">
        <FormField id="hd-dental" label="Dental Service" icon={Building2}>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={dental} onChange={(e) => setDental(e.target.checked)} className="rounded border-[var(--input)]" />
            <span className="text-sm text-[var(--foreground)]">Dental service available</span>
          </label>
        </FormField>
        <FormField id="hd-inout" label="IN Or OUT" icon={Building2}>
          <select id="hd-inout" value={outOrInPatient} onChange={(e) => setOutOrInPatient(e.target.value)} className={inputBase}>
            <option value="">—</option>
            <option value="BOTH">BOTH</option>
            <option value="OUT">OUT</option>
            <option value="IN">IN</option>
          </select>
        </FormField>
        <FormField id="hd-remarks" label="Hospital Remarks" icon={Building2}>
          <textarea id="hd-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={1} className={inputBase + ' resize-y min-h-[2rem] py-1.5'} />
        </FormField>
        <FormField id="hd-status" label="Status" icon={Building2}>
          <select id="hd-status" value={status} onChange={(e) => setStatus(e.target.value)} className={inputBase}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>
      {submitError && <p className="text-sm text-[var(--destructive)] col-span-full">{submitError}</p>}
      <div className="col-span-full">
        <Button type="submit" disabled={updateMutation.isPending || !name.trim()} className="min-w-[100px]">
          {updateMutation.isPending ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </form>
  )
}

function HospitalBranchesTab({ hospitalId, hospitalName }: { hospitalId: string; hospitalName?: string }) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)
  const [editBranchId, setEditBranchId] = useState<string | null>(null)

  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['hospitals', hospitalId, 'branches'],
    queryFn: () => apiGet<HospitalBranch[]>(`/hospitals/${hospitalId}/branches?skip=0&limit=500`, opts),
    enabled: !!hospitalId && !!opts.tenantId && !!opts.token,
  })

  if (isLoading) {
    return <TableSkeleton columns={3} rows={5} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          Branches for {hospitalName ?? 'this hospital'}.
        </p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5 mr-1" aria-hidden />
          Add branch
        </Button>
      </div>
      {branches.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">No branches yet. Add one to get started.</p>
      ) : (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left py-2 px-3 font-medium">Name</th>
                <th className="text-left py-2 px-3 font-medium">Address</th>
                <th className="text-left py-2 px-3 font-medium">Contact</th>
                <th className="text-left py-2 px-3 font-medium">Location</th>
                <th className="text-left py-2 px-3 w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b) => (
                <tr key={b.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-2 px-3 font-medium">{b.name}</td>
                  <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-xs truncate">{b.address ?? '—'}</td>
                  <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-[120px] truncate">{b.contact_person ?? '—'}</td>
                  <td className="py-2 px-3 text-[var(--foreground-muted)] max-w-[120px] truncate">{b.location ?? '—'}</td>
                  <td className="py-2 px-3">
                    <Button variant="ghost" size="sm" onClick={() => setEditBranchId(b.id)}>
                      <SquarePen className="size-3.5" aria-hidden />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddBranchDialog
        hospitalId={hospitalId}
        hospitalName={hospitalName}
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={() => {
          setShowAdd(false)
          queryClient.invalidateQueries({ queryKey: ['hospitals', hospitalId, 'branches'] })
        }}
      />
      <EditBranchDialog
        hospitalId={hospitalId}
        branchId={editBranchId ?? ''}
        open={!!editBranchId}
        onOpenChange={(open) => !open && setEditBranchId(null)}
        onSuccess={() => {
          setEditBranchId(null)
          queryClient.invalidateQueries({ queryKey: ['hospitals', hospitalId, 'branches'] })
        }}
      />
    </div>
  )
}

function HospitalServicesTab({ hospitalId }: { hospitalId: string }) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['hospitals', hospitalId, 'services'],
    queryFn: () => apiGet<HospitalServiceRow[]>(`/hospitals/${hospitalId}/services?skip=0&limit=500`, opts),
    enabled: !!hospitalId && !!opts.tenantId && !!opts.token,
  })
  const { data: catalogServices = [] } = useQuery({
    queryKey: ['services', 'all'],
    queryFn: () => apiGet<CatalogItem[]>(`/services?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })
  const serviceById = buildIdToEntityMap(catalogServices)

  if (isLoading) return <TableSkeleton columns={3} rows={5} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--foreground-muted)]">Service prices for this hospital.</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5 mr-1" aria-hidden />
          Add service
        </Button>
      </div>
      {services.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">No services configured. Add one to set prices.</p>
      ) : (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left py-2 px-3 font-medium">Service</th>
                <th className="text-left py-2 px-3 font-medium">Amount</th>
                <th className="text-left py-2 px-3 font-medium">Effective date</th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-2 px-3">{serviceById[s.service_id]?.name ?? s.service_id}</td>
                  <td className="py-2 px-3">{String(s.amount)}</td>
                  <td className="py-2 px-3 text-[var(--foreground-muted)]">{s.effective_date ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddHospitalServiceDialog
        hospitalId={hospitalId}
        services={catalogServices}
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['hospitals', hospitalId, 'services'] })}
      />
    </div>
  )
}

function HospitalMedicinesTab({ hospitalId }: { hospitalId: string }) {
  const opts = useApi()
  const queryClient = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: medicines = [], isLoading } = useQuery({
    queryKey: ['hospitals', hospitalId, 'medicines'],
    queryFn: () => apiGet<HospitalMedicineRow[]>(`/hospitals/${hospitalId}/medicines?skip=0&limit=500`, opts),
    enabled: !!hospitalId && !!opts.tenantId && !!opts.token,
  })
  const { data: catalogMedicines = [] } = useQuery({
    queryKey: ['medicines', 'all'],
    queryFn: () => apiGet<CatalogItem[]>(`/medicines?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token,
  })
  const medicineById = buildIdToEntityMap(catalogMedicines)

  if (isLoading) return <TableSkeleton columns={3} rows={5} />

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-[var(--foreground-muted)]">Medicine prices for this hospital.</p>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="size-3.5 mr-1" aria-hidden />
          Add medicine
        </Button>
      </div>
      {medicines.length === 0 ? (
        <p className="text-sm text-[var(--foreground-muted)]">No medicines configured. Add one to set prices.</p>
      ) : (
        <div className="rounded-lg border border-[var(--border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                <th className="text-left py-2 px-3 font-medium">Medicine</th>
                <th className="text-left py-2 px-3 font-medium">Unit price</th>
                <th className="text-left py-2 px-3 font-medium">Effective date</th>
              </tr>
            </thead>
            <tbody>
              {medicines.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="py-2 px-3">{medicineById[m.medicine_id]?.name ?? m.medicine_id}</td>
                  <td className="py-2 px-3">{String(m.unit_price)}</td>
                  <td className="py-2 px-3 text-[var(--foreground-muted)]">{m.effective_date ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddHospitalMedicineDialog
        hospitalId={hospitalId}
        medicines={catalogMedicines}
        open={showAdd}
        onOpenChange={setShowAdd}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['hospitals', hospitalId, 'medicines'] })}
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

/* ─── Add Branch dialog ─── */

function AddBranchDialog({
  hospitalId,
  hospitalName,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  hospitalName?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [location, setLocation] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { name: string; address?: string; contact_person?: string; location?: string; remarks?: string }) =>
      apiPost<HospitalBranch>(`/hospitals/${hospitalId}/branches`, body, opts),
    onSuccess: () => {
      onSuccess()
      setName('')
      setAddress('')
      setContactPerson('')
      setLocation('')
      setRemarks('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setName('')
      setAddress('')
      setContactPerson('')
      setLocation('')
      setRemarks('')
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  if (!hospitalId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">New branch</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">{hospitalName ? `Add a branch for ${hospitalName}.` : 'Add a branch.'}</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!name.trim()) return
            createMutation.mutate({
              name: name.trim(),
              address: address.trim() || undefined,
              contact_person: contactPerson.trim() || undefined,
              location: location.trim() || undefined,
              remarks: remarks.trim() || undefined,
            })
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <FormField id="ab-name" label="Name *" icon={Building2}>
              <input id="ab-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputBase} />
            </FormField>
            <FormField id="ab-address" label="Address" icon={MapPin}>
              <input id="ab-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="ab-contact" label="Contact Person" icon={Building2}>
              <input id="ab-contact" type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="ab-location" label="Location" icon={MapPin}>
              <input id="ab-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputBase} placeholder="Area or region" />
            </FormField>
            <FormField id="ab-remarks" label="Remarks" icon={Building2}>
              <textarea id="ab-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={inputBase + ' resize-y'} />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !name.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Creating…' : 'Create branch'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit Branch dialog ─── */

function EditBranchDialog({
  hospitalId,
  branchId,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  branchId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [location, setLocation] = useState('')
  const [remarks, setRemarks] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: branch } = useQuery({
    queryKey: ['hospital-branch', hospitalId, branchId],
    queryFn: () => apiGet<HospitalBranch>(`/hospitals/${hospitalId}/branches/${branchId}`, opts),
    enabled: open && !!hospitalId && !!branchId && !!opts.tenantId && !!opts.token,
  })

  if (branch && !loaded) {
    setName(branch.name)
    setAddress(branch.address ?? '')
    setContactPerson(branch.contact_person ?? '')
    setLocation(branch.location ?? '')
    setRemarks(branch.remarks ?? '')
    setLoaded(true)
  }

  const updateMutation = useMutation({
    mutationFn: (body: { name: string; address?: string; contact_person?: string; location?: string; remarks?: string }) =>
      apiPatch<HospitalBranch>(`/hospitals/${hospitalId}/branches/${branchId}`, body, opts),
    onSuccess: () => {
      onSuccess()
      setLoaded(false)
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) { setLoaded(false); setSubmitError(null) }
    onOpenChange(openState)
  }

  if (!hospitalId || !branchId) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Edit branch</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Update branch information.</p>
            </div>
          </div>
        </header>
        {!branch ? (
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
                address: address.trim() || undefined,
                contact_person: contactPerson.trim() || undefined,
                location: location.trim() || undefined,
                remarks: remarks.trim() || undefined,
              })
            }}
            className="flex flex-col"
          >
            <div className="flex-1 px-6 py-5 space-y-4">
              <FormField id="eb-name" label="Name *" icon={Building2}>
                <input id="eb-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputBase} />
              </FormField>
              <FormField id="eb-address" label="Address" icon={MapPin}>
                <input id="eb-address" type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="eb-contact" label="Contact Person" icon={Building2}>
                <input id="eb-contact" type="text" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="eb-location" label="Location" icon={MapPin}>
                <input id="eb-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputBase} />
              </FormField>
              <FormField id="eb-remarks" label="Remarks" icon={Building2}>
                <textarea id="eb-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} className={inputBase + ' resize-y'} />
              </FormField>
              {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
            </div>
            <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
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

/* ─── Add Hospital Service dialog ─── */

function AddHospitalServiceDialog({
  hospitalId,
  services,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  services: CatalogItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [serviceId, setServiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { service_id: string; amount: string; effective_date?: string }) =>
      apiPost(`/hospitals/${hospitalId}/services`, body, opts),
    onSuccess: () => {
      onSuccess()
      setServiceId('')
      setAmount('')
      setEffectiveDate('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) { setServiceId(''); setAmount(''); setEffectiveDate(''); setSubmitError(null) }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Wrench className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Add service price</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Set price for a service at this hospital.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!serviceId.trim() || !amount.trim()) return
            createMutation.mutate({
              service_id: serviceId.trim(),
              amount: amount.trim(),
              effective_date: effectiveDate.trim() || undefined,
            })
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <FormField id="ahs-service" label="Service *" icon={Wrench}>
              <select id="ahs-service" value={serviceId} onChange={(e) => setServiceId(e.target.value)} required className={inputBase}>
                <option value="">Select service</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </FormField>
            <FormField id="ahs-amount" label="Amount *" icon={Building2}>
              <input id="ahs-amount" type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" className={inputBase} />
            </FormField>
            <FormField id="ahs-date" label="Effective date" icon={Building2}>
              <input id="ahs-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputBase} />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !serviceId.trim() || !amount.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Add Hospital Medicine dialog ─── */

function AddHospitalMedicineDialog({
  hospitalId,
  medicines,
  open,
  onOpenChange,
  onSuccess,
}: {
  hospitalId: string
  medicines: CatalogItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [medicineId, setMedicineId] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [effectiveDate, setEffectiveDate] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: { medicine_id: string; unit_price: string; effective_date?: string }) =>
      apiPost(`/hospitals/${hospitalId}/medicines`, body, opts),
    onSuccess: () => {
      onSuccess()
      setMedicineId('')
      setUnitPrice('')
      setEffectiveDate('')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) { setMedicineId(''); setUnitPrice(''); setEffectiveDate(''); setSubmitError(null) }
    onOpenChange(openState)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-lg p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Pill className="size-5" aria-hidden />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">Add medicine price</h2>
              <p className="text-sm text-[var(--foreground-muted)] mt-0.5">Set unit price for a medicine at this hospital.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!medicineId.trim() || !unitPrice.trim()) return
            createMutation.mutate({
              medicine_id: medicineId.trim(),
              unit_price: unitPrice.trim(),
              effective_date: effectiveDate.trim() || undefined,
            })
          }}
          className="flex flex-col"
        >
          <div className="flex-1 px-6 py-5 space-y-4">
            <FormField id="ahm-medicine" label="Medicine *" icon={Pill}>
              <select id="ahm-medicine" value={medicineId} onChange={(e) => setMedicineId(e.target.value)} required className={inputBase}>
                <option value="">Select medicine</option>
                {medicines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </FormField>
            <FormField id="ahm-price" label="Unit price *" icon={Building2}>
              <input id="ahm-price" type="text" inputMode="decimal" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required placeholder="0.00" className={inputBase} />
            </FormField>
            <FormField id="ahm-date" label="Effective date" icon={Building2}>
              <input id="ahm-date" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputBase} />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !medicineId.trim() || !unitPrice.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Adding…' : 'Add'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Create dialog ─── */

const CREATE_HOSPITAL_EMPTY = {
  name: '',
  address: '',
  reference: '',
  contactPerson: '',
  phone: '',
  email: '',
  website: '',
  remarks: '',
  districtId: '',
  outpatientCapacity: '',
  inpatientCapacity: '',
  outOrInPatient: '',
  dental: false,
  status: 'active',
}

function CreateHospitalDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [form, setForm] = useState(CREATE_HOSPITAL_EMPTY)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const update = (key: keyof typeof CREATE_HOSPITAL_EMPTY, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => apiPost<Hospital>('/hospitals', body, opts),
    onSuccess: () => {
      onSuccess()
      setForm(CREATE_HOSPITAL_EMPTY)
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) {
      setForm(CREATE_HOSPITAL_EMPTY)
      setSubmitError(null)
    }
    onOpenChange(openState)
  }

  const toPayload = () => ({
    name: form.name.trim(),
    address: form.address.trim() || undefined,
    reference: form.reference.trim() || undefined,
    contact_person: form.contactPerson.trim() || undefined,
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    website: form.website.trim() || undefined,
    remarks: form.remarks.trim() || undefined,
    district_id: form.districtId.trim() ? Number(form.districtId) : undefined,
    outpatient_capacity: form.outpatientCapacity.trim() ? Number(form.outpatientCapacity) : undefined,
    inpatient_capacity: form.inpatientCapacity.trim() ? Number(form.inpatientCapacity) : undefined,
    out_or_in_patient: form.outOrInPatient.trim() || undefined,
    dental: form.dental,
    status: form.status.trim() || 'active',
  })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden max-h-[90vh] flex flex-col" closeOnOutsideClick={false}>
        <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-5 pr-12 py-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Building2 className="size-4" aria-hidden />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)]">New hospital</h2>
              <p className="text-xs text-[var(--foreground-muted)]">Required fields marked with *.</p>
            </div>
          </div>
        </header>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.name.trim()) return
            createMutation.mutate(toPayload())
          }}
          className="flex flex-col min-h-0"
        >
          <div className="flex-1 px-5 py-3 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
            <FormField id="h-name" label="Hospital Name *" icon={Building2} className="md:col-span-2">
              <input id="h-name" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. City General Hospital" className={inputBase} />
            </FormField>
            <FormField id="h-reference" label="Reference No" icon={Building2}>
              <input id="h-reference" type="text" value={form.reference} onChange={(e) => update('reference', e.target.value)} placeholder="e.g. SUSP_169" className={inputBase} />
            </FormField>
            <FormField id="h-contact" label="Contact Person" icon={Building2}>
              <input id="h-contact" type="text" value={form.contactPerson} onChange={(e) => update('contactPerson', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-address" label="Hospital Address" icon={MapPin} className="md:col-span-2">
              <textarea id="h-address" value={form.address} onChange={(e) => update('address', e.target.value)} rows={1} placeholder="Street, city" className={inputBase + ' resize-y min-h-[2rem] py-1.5'} />
            </FormField>
            <FormField id="h-outpatient" label="OutPatient Capacity" icon={Building2}>
              <input id="h-outpatient" type="number" min={0} value={form.outpatientCapacity} onChange={(e) => update('outpatientCapacity', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-inpatient" label="InPatient Capacity" icon={Building2}>
              <input id="h-inpatient" type="number" min={0} value={form.inpatientCapacity} onChange={(e) => update('inpatientCapacity', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-district" label="District ID" icon={MapPin}>
              <input id="h-district" type="text" value={form.districtId} onChange={(e) => update('districtId', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-inout" label="IN Or OUT" icon={Building2}>
              <select id="h-inout" value={form.outOrInPatient} onChange={(e) => update('outOrInPatient', e.target.value)} className={inputBase}>
                <option value="">—</option>
                <option value="BOTH">BOTH</option>
                <option value="OUT">OUT</option>
                <option value="IN">IN</option>
              </select>
            </FormField>
            <FormField id="h-email" label="Email" icon={Building2}>
              <input id="h-email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-website" label="Website" icon={Building2}>
              <input id="h-website" type="url" value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://" className={inputBase} />
            </FormField>
            <FormField id="h-phone" label="Hospital Number" icon={Building2}>
              <input id="h-phone" type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputBase} />
            </FormField>
            <FormField id="h-status" label="Status" icon={Building2}>
              <select id="h-status" value={form.status} onChange={(e) => update('status', e.target.value)} className={inputBase}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
            <FormField id="h-dental" label="Dental Service" icon={Building2} className="md:col-span-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.dental} onChange={(e) => update('dental', e.target.checked)} className="rounded border-[var(--input)]" />
                <span className="text-sm text-[var(--foreground)]">Dental service available</span>
              </label>
            </FormField>
            <FormField id="h-remarks" label="Remarks" icon={Building2} className="md:col-span-2">
              <textarea id="h-remarks" value={form.remarks} onChange={(e) => update('remarks', e.target.value)} rows={1} className={inputBase + ' resize-y min-h-[2rem] py-1.5'} />
            </FormField>
            {submitError && <p className="text-sm text-[var(--destructive)] md:col-span-2">{submitError}</p>}
          </div>
          <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-5 py-3 flex flex-row items-center justify-end gap-2 shrink-0">
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending || !form.name.trim()} className="min-w-[100px]">
              {createMutation.isPending ? 'Creating…' : 'Create hospital'}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  )
}

