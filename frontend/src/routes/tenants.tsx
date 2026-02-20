import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'

export const Route = createFileRoute('/tenants')({
  beforeLoad: () => requireAuthBeforeLoad('/tenants'),
  component: TenantsPage,
})

function TenantsPage() {
  return (
    <div className="px-8 py-12 max-w-4xl">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Tenants</h1>
      <p className="text-[var(--foreground-muted)]">Tenant management — coming soon.</p>
    </div>
  )
}
