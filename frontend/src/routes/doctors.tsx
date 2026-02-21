import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { buildIdToEntityMap } from '#/lib/utils'
import { Button } from '#/components/ui/button'
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
import { ListPagePagination, TableSkeleton } from '#/components/list-page'
import { Stethoscope, Search, Plus, Building2 } from 'lucide-react'

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
    <div className="flex flex-col gap-0">
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
          <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium">Specialization</th>
                  <th className="text-left py-2.5 px-3 font-medium">Hospital</th>
                  <th className="text-left py-2.5 px-3 w-20">Actions</th>
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
                    <td className="py-2.5 px-3" />
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New doctor</DialogTitle>
          <DialogDescription>Add a doctor linked to a hospital.</DialogDescription>
        </DialogHeader>
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
          className="space-y-4"
        >
          <div>
            <label htmlFor="doc-hospital" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Hospital *
            </label>
            <select
              id="doc-hospital"
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            >
              <option value="">Select hospital</option>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="doc-name" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Name *
            </label>
            <input
              id="doc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          <div>
            <label htmlFor="doc-spec" className="block text-sm text-[var(--foreground-muted)] mb-1">
              Specialization
            </label>
            <input
              id="doc-spec"
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="w-full border border-[var(--input)] bg-[var(--secondary)] px-3 py-2 text-sm text-[var(--foreground)] rounded-md"
            />
          </div>
          {submitError && <p className="text-sm text-[var(--destructive)]">{submitError}</p>}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || !hospitalId.trim() || !name.trim()}>
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
