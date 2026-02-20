import { createFileRoute } from '@tanstack/react-router'
import { requireAuthBeforeLoad } from '#/lib/route-auth'
import { MedicinesPage } from '#/components/pages/MedicinesPage'

export const Route = createFileRoute('/medicines')({
  beforeLoad: () => requireAuthBeforeLoad('/medicines'),
  component: MedicinesPage,
})
