import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { apiGet, apiPost, apiPatch, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'
import { Button } from '#/components/ui/button'
import { Dialog, DialogContent } from '#/components/ui/dialog'
import { FORM_INPUT_CLASS, FORM_LABEL_CLASS } from '#/components/ui/form-styles'
import { Skeleton } from '#/components/ui/skeleton'
import { Building2, CreditCard, User, UserCircle2 } from 'lucide-react'

export const Route = createFileRoute('/members')({
  beforeLoad: () => requireAuthBeforeLoad('/members'),
  component: MembersLayout,
})

function MembersLayout() {
  return <Outlet />
}

/** Shared dialog layout: icon + title + subtitle, then body, then footer. */
function FormDialogShell({
  icon: Icon,
  title,
  subtitle,
  children,
  footer,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  return (
    <>
      <header className="border-b border-[var(--border)] bg-[var(--muted)]/40 px-6 pr-14 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
            <Icon className="size-5" aria-hidden />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
            <p className="text-sm text-[var(--foreground-muted)] mt-0.5">{subtitle}</p>
          </div>
        </div>
      </header>
      <div className="flex-1 px-6 py-5 space-y-4">{children}</div>
      <footer className="border-t border-[var(--border)] bg-[var(--muted)]/30 px-6 py-4 flex flex-row items-center justify-end gap-3">
        {footer}
      </footer>
    </>
  )
}

/** Card no, name, DOB, status. Single source of truth for member core fields. */
function MemberCoreFields({
  idPrefix,
  cardNo,
  name,
  dob,
  status,
  onCardNo,
  onName,
  onDob,
  onStatus,
  cardRequired = false,
  nameRequired = false,
}: {
  idPrefix: string
  cardNo: string
  name: string
  dob: string
  status: string
  onCardNo: (v: string) => void
  onName: (v: string) => void
  onDob: (v: string) => void
  onStatus: (v: string) => void
  cardRequired?: boolean
  nameRequired?: boolean
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-card`} className={FORM_LABEL_CLASS}>
          <span className="inline-flex items-center gap-2">
            <CreditCard className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            Card no {cardRequired && '*'}
          </span>
        </label>
        <input
          id={`${idPrefix}-card`}
          type="text"
          value={cardNo}
          onChange={(e) => onCardNo(e.target.value)}
          required={cardRequired}
          placeholder="e.g. EMP001"
          className={FORM_INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-name`} className={FORM_LABEL_CLASS}>
          <span className="inline-flex items-center gap-2">
            <User className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
            Name {nameRequired && '*'}
          </span>
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          value={name}
          onChange={(e) => onName(e.target.value)}
          required={nameRequired}
          placeholder="Full name"
          className={FORM_INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-dob`} className={FORM_LABEL_CLASS}>Date of birth</label>
        <input
          id={`${idPrefix}-dob`}
          type="date"
          value={dob}
          onChange={(e) => onDob(e.target.value)}
          className={FORM_INPUT_CLASS}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}-status`} className={FORM_LABEL_CLASS}>Status</label>
        <select
          id={`${idPrefix}-status`}
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          className={FORM_INPUT_CLASS}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </>
  )
}

/* ─── Create member dialog ─── */

interface MemberCreatePayload {
  company_id: string
  scheme_id: string
  card_no: string
  name: string
  dob?: string | null
  status: string
}

export function CreateMemberDialog({
  open,
  onOpenChange,
  initialCompanyId,
  companies,
  schemes,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialCompanyId?: string
  companies: { id: string; name: string }[]
  schemes: { id: string; name: string }[]
  onSuccess: () => void
}) {
  const opts = useApi()
  const [companyId, setCompanyId] = useState(initialCompanyId ?? '')
  const [schemeId, setSchemeId] = useState('')
  const [cardNo, setCardNo] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [status, setStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)

  const createMutation = useMutation({
    mutationFn: (body: MemberCreatePayload) => apiPost<{ id: string }>('/members', body, opts),
    onSuccess: () => {
      onSuccess()
      setCompanyId(initialCompanyId ?? '')
      setSchemeId('')
      setCardNo('')
      setName('')
      setDob('')
      setStatus('active')
      setSubmitError(null)
    },
    onError: (err) => setSubmitError(getApiErrorDetail(err)),
  })

  const handleClose = (openState: boolean) => {
    if (!openState) setSubmitError(null)
    onOpenChange(openState)
  }

  useEffect(() => {
    if (open && initialCompanyId && initialCompanyId !== companyId) {
      setCompanyId(initialCompanyId)
      setSchemeId('')
    }
  }, [open, initialCompanyId])

  const schemesForCompany = companyId
    ? schemes.filter((s) => 'company_id' in s && (s as { company_id: string }).company_id === companyId)
    : schemes
  const schemesOptions = schemesForCompany.length > 0 ? schemesForCompany : schemes

  const valid = name.trim() && cardNo.trim() && companyId && schemeId

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[60] sm:max-w-2xl p-0 gap-0 overflow-hidden" closeOnOutsideClick={false}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            createMutation.mutate({
              company_id: companyId,
              scheme_id: schemeId,
              card_no: cardNo.trim(),
              name: name.trim(),
              dob: dob.trim() || undefined,
              status,
            })
          }}
          className="flex flex-col"
        >
          <FormDialogShell
            icon={UserCircle2}
            title="New member"
            subtitle="Add a member (company staff). Required fields are marked with *."
            footer={
              <>
                <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || !valid} className="min-w-[100px]">
                  {createMutation.isPending ? 'Creating…' : 'Create member'}
                </Button>
              </>
            }
          >
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label htmlFor="mem-company" className={FORM_LABEL_CLASS}>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                    Company *
                  </span>
                </label>
                <select
                  id="mem-company"
                  value={companyId}
                  onChange={(e) => {
                    setCompanyId(e.target.value)
                    setSchemeId('')
                  }}
                  required
                  className={FORM_INPUT_CLASS}
                >
                  <option value="">— Select company —</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="mem-scheme" className={FORM_LABEL_CLASS}>
                  <span className="inline-flex items-center gap-2">
                    <Building2 className="size-4 shrink-0 text-[var(--foreground-muted)]" aria-hidden />
                    Scheme *
                  </span>
                </label>
                <select
                  id="mem-scheme"
                  value={schemeId}
                  onChange={(e) => setSchemeId(e.target.value)}
                  required
                  className={FORM_INPUT_CLASS}
                >
                  <option value="">— Select scheme —</option>
                  {schemesOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <MemberCoreFields
                idPrefix="mem"
                cardNo={cardNo}
                name={name}
                dob={dob}
                status={status}
                onCardNo={setCardNo}
                onName={setName}
                onDob={setDob}
                onStatus={setStatus}
                cardRequired
                nameRequired
              />
              {submitError && <p className="text-sm text-[var(--destructive)] col-span-2">{submitError}</p>}
            </div>
          </FormDialogShell>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ─── Edit member dialog ─── */

interface MemberUpdatePayload {
  card_no?: string | null
  name?: string | null
  dob?: string | null
  status?: string | null
}

export function EditMemberDialog({
  memberId,
  open,
  onOpenChange,
  onSuccess,
}: {
  memberId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const opts = useApi()
  const [cardNo, setCardNo] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [status, setStatus] = useState('active')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const { data: member } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () =>
      apiGet<{ card_no: string; name: string; dob: string | null; status: string }>(
        `/members/${memberId}`,
        opts
      ),
    enabled: open && !!memberId && !!opts.tenantId && !!opts.token,
  })

  useEffect(() => {
    if (member && !loaded) {
      setCardNo(member.card_no)
      setName(member.name)
      setDob(member.dob ? member.dob.slice(0, 10) : '')
      setStatus(member.status)
      setLoaded(true)
    }
  }, [member, loaded])

  const updateMutation = useMutation({
    mutationFn: (body: MemberUpdatePayload) => apiPatch<{ id: string }>(`/members/${memberId}`, body, opts),
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
        {!member ? (
          <div className="px-6 py-5 space-y-3">
            <div className="grid grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              updateMutation.mutate({
                card_no: cardNo.trim() || undefined,
                name: name.trim() || undefined,
                dob: dob.trim() || undefined,
                status,
              })
            }}
            className="flex flex-col"
          >
            <FormDialogShell
              icon={UserCircle2}
              title="Edit member"
              subtitle="Update member information."
              footer={
                <>
                  <Button type="button" variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
                  <Button type="submit" disabled={updateMutation.isPending} className="min-w-[100px]">
                    {updateMutation.isPending ? 'Saving…' : 'Save changes'}
                  </Button>
                </>
              }
            >
              <div className="grid grid-cols-2 gap-5">
                <MemberCoreFields
                  idPrefix="mem-edit"
                  cardNo={cardNo}
                  name={name}
                  dob={dob}
                  status={status}
                  onCardNo={setCardNo}
                  onName={setName}
                  onDob={setDob}
                  onStatus={setStatus}
                />
                {submitError && <p className="text-sm text-[var(--destructive)] col-span-2">{submitError}</p>}
              </div>
            </FormDialogShell>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
