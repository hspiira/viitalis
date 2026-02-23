import { createFileRoute, Outlet } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'

export const Route = createFileRoute('/schemes')({
  beforeLoad: () => requireAuthBeforeLoad('/schemes'),
  component: SchemesLayout,
})

function SchemesLayout() {
  return <Outlet />
}

export { CreateSchemeDialog, EditSchemeDialog, StatusBadge, type Scheme, type CompanyRef } from './schemes-dialogs'
