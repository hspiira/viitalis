import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { apiGet, apiPost, getApiErrorDetail } from '#/lib/api-client'
import { useApi } from '#/lib/use-api'

export const Route = createFileRoute('/banks')({
  beforeLoad: () => requireAuthBeforeLoad('/banks'),
  component: BanksPage,
})

interface Bank {
  id: string
  tenant_id: string
  name: string
  code: string | null
  status: string
}

interface BankBranch {
  id: string
  tenant_id: string
  bank_id: string
  name: string
  address: string | null
  status: string
}

interface AccountDetail {
  id: string
  tenant_id: string
  member_id: string | null
  hospital_id: string | null
  account_type: string
  balance: string
  virtual_balance: string
  currency: string
  status: string
}

const apiOpts = (token: string | null, tenantId: string | null) => ({
  token: token ?? undefined,
  tenantId: tenantId ?? undefined,
})

function BanksPage() {
  const { token, tenantId } = useApi()
  const queryClient = useQueryClient()
  const opts = apiOpts(token, tenantId)

  const [activeTab, setActiveTab] = useState<'banks' | 'account-details'>('banks')
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null)
  const [showBankForm, setShowBankForm] = useState(false)
  const [showBranchForm, setShowBranchForm] = useState(false)
  const [showAccountForm, setShowAccountForm] = useState(false)

  const { data: banks = [], isLoading: banksLoading, error: banksError } = useQuery({
    queryKey: ['banks', tenantId],
    queryFn: () => apiGet<Bank[]>('/banks', opts),
    enabled: !!token && !!tenantId && activeTab === 'banks',
  })

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ['banks', selectedBankId, 'branches'],
    queryFn: () =>
      apiGet<BankBranch[]>(`/banks/${selectedBankId}/branches`, opts),
    enabled: !!token && !!tenantId && !!selectedBankId,
  })

  const { data: accountDetails = [], isLoading: accountDetailsLoading } = useQuery({
    queryKey: ['account-details', tenantId],
    queryFn: () => apiGet<AccountDetail[]>('/account-details', opts),
    enabled: !!token && !!tenantId && activeTab === 'account-details',
  })

  const createBankMutation = useMutation({
    mutationFn: (body: { name: string; code?: string; status?: string }) =>
      apiPost<Bank>('/banks', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      setShowBankForm(false)
    },
  })

  const createBranchMutation = useMutation({
    mutationFn: (body: { name: string; address?: string; status?: string }) =>
      apiPost<BankBranch>(`/banks/${selectedBankId}/branches`, body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks', selectedBankId, 'branches'] })
      setShowBranchForm(false)
    },
  })

  const createAccountMutation = useMutation({
    mutationFn: (body: {
      member_id?: string
      hospital_id?: string
      account_type?: string
      balance?: string
      virtual_balance?: string
      currency?: string
      status?: string
    }) => apiPost<AccountDetail>('/account-details', body, opts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account-details'] })
      setShowAccountForm(false)
    },
  })

  if (!tenantId) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Banks & account details</h1>
        <p className="text-[var(--foreground-muted)]">Sign in and select a tenant to manage banks and account details.</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Banks & account details</h1>
          <p className="text-[var(--foreground-muted)] mt-0.5">
            Manage banks, branches, and account details.
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)] mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('banks')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'banks'
              ? 'text-[var(--foreground-active)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          Banks & branches
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('account-details')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'account-details'
              ? 'text-[var(--foreground-active)] border-b-2 border-[var(--primary)]'
              : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
          }`}
        >
          Account details
        </button>
      </div>

      {activeTab === 'banks' && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-[var(--foreground)]">Banks</h2>
            <button
              type="button"
              onClick={() => setShowBankForm(true)}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Add bank
            </button>
          </div>

          {showBankForm && (
            <BankForm
              onCancel={() => setShowBankForm(false)}
              onSubmit={(name, code, status) =>
                createBankMutation.mutate({ name, code: code || undefined, status })
              }
              isPending={createBankMutation.isPending}
              error={createBankMutation.error ? getApiErrorDetail(createBankMutation.error as { status: number; detail: unknown }) : null}
            />
          )}

          {banksLoading && <p className="text-[var(--foreground-muted)]">Loading banks…</p>}
          {banksError && (
            <p className="text-[var(--destructive)]">Failed to load banks.</p>
          )}
          {!banksLoading && !banksError && (
            <div className="border border-[var(--border)] overflow-hidden mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--muted)] text-[var(--foreground-muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Code</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium w-24" />
                  </tr>
                </thead>
                <tbody className="text-[var(--foreground)]">
                  {banks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[var(--foreground-muted)]">
                        No banks. Add one above.
                      </td>
                    </tr>
                  ) : (
                    banks.map((b) => (
                      <tr
                        key={b.id}
                        className={`border-t border-[var(--border-subtle)] ${selectedBankId === b.id ? 'bg-[var(--muted)]' : ''}`}
                      >
                        <td className="px-4 py-2">{b.name}</td>
                        <td className="px-4 py-2">{b.code ?? '—'}</td>
                        <td className="px-4 py-2">{b.status}</td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => setSelectedBankId(selectedBankId === b.id ? null : b.id)}
                            className="text-[var(--primary)] text-sm hover:underline"
                          >
                            {selectedBankId === b.id ? 'Hide branches' : 'Branches'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {selectedBankId && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-medium text-[var(--foreground)]">Branches</h3>
                <button
                  type="button"
                  onClick={() => setShowBranchForm(true)}
                  className="bg-[var(--secondary)] border border-[var(--border)] text-[var(--foreground)] px-3 py-1.5 text-sm hover:bg-[var(--muted)]"
                >
                  Add branch
                </button>
              </div>
              {showBranchForm && (
                <BranchForm
                  onCancel={() => setShowBranchForm(false)}
                  onSubmit={(name, address, status) =>
                    createBranchMutation.mutate({ name, address: address || undefined, status })
                  }
                  isPending={createBranchMutation.isPending}
                />
              )}
              {branchesLoading && <p className="text-[var(--foreground-muted)] text-sm">Loading branches…</p>}
              {!branchesLoading && (
                <div className="border border-[var(--border)] overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--muted)] text-[var(--foreground-muted)]">
                      <tr>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Address</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--foreground)]">
                      {branches.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-4 text-center text-[var(--foreground-muted)]">
                            No branches. Add one above.
                          </td>
                        </tr>
                      ) : (
                        branches.map((br) => (
                          <tr key={br.id} className="border-t border-[var(--border-subtle)]">
                            <td className="px-4 py-2">{br.name}</td>
                            <td className="px-4 py-2">{br.address ?? '—'}</td>
                            <td className="px-4 py-2">{br.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'account-details' && (
        <>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-medium text-[var(--foreground)]">Account details</h2>
            <button
              type="button"
              onClick={() => setShowAccountForm(true)}
              className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90"
            >
              Add account detail
            </button>
          </div>
          {showAccountForm && (
            <AccountDetailForm
              onCancel={() => setShowAccountForm(false)}
              onSubmit={(body) => createAccountMutation.mutate(body)}
              isPending={createAccountMutation.isPending}
              error={createAccountMutation.error ? getApiErrorDetail(createAccountMutation.error as { status: number; detail: unknown }) : null}
            />
          )}
          {accountDetailsLoading && <p className="text-[var(--foreground-muted)]">Loading account details…</p>}
          {!accountDetailsLoading && (
            <div className="border border-[var(--border)] overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--muted)] text-[var(--foreground-muted)]">
                  <tr>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Balance</th>
                    <th className="px-4 py-2 font-medium">Currency</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--foreground)]">
                  {accountDetails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[var(--foreground-muted)]">
                        No account details. Add one above.
                      </td>
                    </tr>
                  ) : (
                    accountDetails.map((a) => (
                      <tr key={a.id} className="border-t border-[var(--border-subtle)]">
                        <td className="px-4 py-2">{a.account_type}</td>
                        <td className="px-4 py-2">{a.balance}</td>
                        <td className="px-4 py-2">{a.currency}</td>
                        <td className="px-4 py-2">{a.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function BankForm({
  onCancel,
  onSubmit,
  isPending,
  error,
}: {
  onCancel: () => void
  onSubmit: (name: string, code: string, status: string) => void
  isPending: boolean
  error: string | null
}) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('active')
  return (
    <div className="mb-4 p-4 border border-[var(--border)] bg-[var(--card)]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSubmit(name.trim(), code.trim(), status)
        }}
        className="flex flex-wrap gap-4 items-end"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[12rem]"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] w-24"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="border border-[var(--border)] px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  )
}

function BranchForm({
  onCancel,
  onSubmit,
  isPending,
}: {
  onCancel: () => void
  onSubmit: (name: string, address: string, status: string) => void
  isPending: boolean
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState('active')
  return (
    <div className="mb-4 p-4 border border-[var(--border)] bg-[var(--card)]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) onSubmit(name.trim(), address.trim(), status)
        }}
        className="flex flex-wrap gap-4 items-end"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[12rem]"
            required
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Address</span>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] min-w-[16rem]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm">
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="border border-[var(--border)] px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function AccountDetailForm({
  onCancel,
  onSubmit,
  isPending,
  error,
}: {
  onCancel: () => void
  onSubmit: (body: {
    account_type?: string
    balance?: string
    virtual_balance?: string
    currency?: string
    status?: string
  }) => void
  isPending: boolean
  error: string | null
}) {
  const [accountType, setAccountType] = useState('member')
  const [balance, setBalance] = useState('0')
  const [virtualBalance, setVirtualBalance] = useState('0')
  const [currency, setCurrency] = useState('USD')
  const [status, setStatus] = useState('active')
  return (
    <div className="mb-4 p-4 border border-[var(--border)] bg-[var(--card)]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit({
            account_type: accountType,
            balance,
            virtual_balance: virtualBalance,
            currency,
            status,
          })
        }}
        className="flex flex-wrap gap-4 items-end"
      >
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Account type</span>
          <select
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
          >
            <option value="member">Member</option>
            <option value="hospital">Hospital</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Balance</span>
          <input
            type="text"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] w-28"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Currency</span>
          <input
            type="text"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)] w-20"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm text-[var(--foreground-muted)]">Status</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-[var(--input)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="bg-[var(--primary)] text-[var(--primary-foreground)] px-4 py-2 text-sm">
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="border border-[var(--border)] px-4 py-2 text-sm">
            Cancel
          </button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>}
    </div>
  )
}
