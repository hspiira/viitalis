import { createFileRoute, Link } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { format } from 'date-fns'
import { apiGet } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { DetailRow } from '#/components/list-page'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '#/components/ui/breadcrumb'
import { ArrowLeft, Building2, UserCircle2, Users, Plus, SquarePen } from 'lucide-react'
import {
  CreateDependantDialog,
  DependantDetailDialog,
  EditDependantDialog,
} from '#/routes/member-dependants'
import { EditMemberDialog } from '#/routes/members'

export const Route = createFileRoute('/members/$memberId')({
  beforeLoad: () => requireAuthBeforeLoad('/members/$memberId'),
  component: MemberDetailPage,
})

interface Member {
  id: string
  tenant_id: string
  company_id: string
  scheme_id: string
  card_no: string
  name: string
  dob: string | null
  status: string
}

interface Dependant {
  id: string
  tenant_id: string
  member_id: string
  name: string
  card_no: string | null
  dob: string | null
}

function MemberDetailPage() {
  const { memberId } = Route.useParams()
  const opts = useApi()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editMemberOpen, setEditMemberOpen] = useState(false)

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => apiGet<Member>(`/members/${memberId}`, opts),
    enabled: !!memberId && !!opts.tenantId && !!opts.token,
  })

  const { data: companies = [] } = useQuery({
    queryKey: ['companies', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>('/companies', opts),
    enabled: !!opts.tenantId && !!opts.token && !!member,
  })

  const { data: schemes = [] } = useQuery({
    queryKey: ['schemes-list', opts.tenantId],
    queryFn: () => apiGet<{ id: string; name: string }[]>(`/schemes?skip=0&limit=500`, opts),
    enabled: !!opts.tenantId && !!opts.token && !!member,
  })

  const { data: dependants = [], isLoading: dependantsLoading } = useQuery({
    queryKey: ['members', memberId, 'dependants'],
    queryFn: () =>
      apiGet<Dependant[]>(`/members/${memberId}/dependants?skip=0&limit=500`, opts),
    enabled: !!memberId && !!opts.tenantId && !!opts.token,
  })

  const companyName = member ? (companies.find((c) => c.id === member.company_id)?.name ?? member.company_id) : '—'
  const schemeName = member ? (schemes.find((s) => s.id === member.scheme_id)?.name ?? member.scheme_id) : '—'

  const invalidateDependants = () => {
    queryClient.invalidateQueries({ queryKey: ['members', memberId, 'dependants'] })
    queryClient.invalidateQueries({ queryKey: ['member-dependant'] })
  }

  if (!opts.tenantId || !opts.token) {
    return (
      <div className="w-full">
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to view this member.</p>
      </div>
    )
  }

  if (memberLoading || !member) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Breadcrumb className="shrink-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/dashboard" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/members" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
                Members
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{member.name || member.card_no || 'Member'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-col gap-3 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" asChild>
            <Link to="/members" className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
              <ArrowLeft className="size-5" aria-label="Back to members" />
            </Link>
          </Button>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <UserCircle2 className="size-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-[var(--foreground)]">
              {member.name || '—'}
            </h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Member (staff) · Card {member.card_no}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setEditMemberOpen(true)}>
            <SquarePen className="size-3.5 mr-1.5" aria-hidden />
            Edit member
          </Button>
        </div>

        <div className="grid gap-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Card no" value={member.card_no} />
          <DetailRow
            label="DOB"
            value={member.dob ? format(new Date(member.dob), 'dd MMM yyyy') : null}
          />
          <DetailRow label="Status" value={member.status} />
          <DetailRow label="Company" value={companyName} />
          <DetailRow label="Scheme" value={schemeName} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/claims" search={{ member_id: member.id }}>
              View claims
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/companies/$companyId" params={{ companyId: member.company_id }} search={{ tab: 'members' }}>
              <Building2 className="size-3.5 mr-1" aria-hidden />
              View company
            </Link>
          </Button>
        </div>
      </header>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
            <Users className="size-4 text-[var(--foreground-muted)]" aria-hidden />
            Dependants
          </h2>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add dependant
          </Button>
        </div>
        <p className="text-xs text-[var(--foreground-muted)]">
          Dependants are covered under this member (e.g. spouse, children).
        </p>

        {dependantsLoading ? (
          <div className="rounded-lg border border-[var(--border)] p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ) : dependants.length === 0 ? (
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-6 text-center">
            <p className="text-sm text-[var(--foreground-muted)]">No dependants for this member yet.</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => setShowCreate(true)}>
              Add dependant
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
                  <th className="py-2.5 px-3 text-left font-medium text-[var(--foreground-muted)]">Name</th>
                  <th className="py-2.5 px-3 text-left font-medium text-[var(--foreground-muted)]">Card no</th>
                  <th className="py-2.5 px-3 text-left font-medium text-[var(--foreground-muted)]">DOB</th>
                  <th className="py-2.5 px-3 w-24 text-left font-medium text-[var(--foreground-muted)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dependants.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--muted)]/20"
                  >
                    <td className="py-2.5 px-3 font-medium text-[var(--foreground)]">{d.name}</td>
                    <td className="py-2.5 px-3 font-mono text-[var(--foreground-muted)]">{d.card_no ?? '—'}</td>
                    <td className="py-2.5 px-3 text-[var(--foreground-muted)] tabular-nums">
                      {d.dob ? format(new Date(d.dob), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(d.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <CreateDependantDialog
        memberId={memberId}
        memberName={member.name}
        open={showCreate}
        onOpenChange={(open) => !open && setShowCreate(false)}
        onSuccess={() => {
          setShowCreate(false)
          invalidateDependants()
        }}
      />
      <DependantDetailDialog
        memberId={memberId}
        dependantId={detailId ?? ''}
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
        onEdit={(id) => {
          setDetailId(null)
          setEditId(id)
        }}
      />
      <EditDependantDialog
        memberId={memberId}
        dependantId={editId ?? ''}
        open={!!editId}
        onOpenChange={(open) => !open && setEditId(null)}
        onSuccess={() => {
          setEditId(null)
          invalidateDependants()
        }}
      />
      <EditMemberDialog
        memberId={memberId}
        open={editMemberOpen}
        onOpenChange={setEditMemberOpen}
        onSuccess={() => {
          setEditMemberOpen(false)
          queryClient.invalidateQueries({ queryKey: ['member', memberId] })
          invalidateDependants()
        }}
      />
    </div>
  )
}
