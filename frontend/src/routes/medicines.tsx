import { createFileRoute } from '@tanstack/react-router'
import { MedicinesPage } from '#/components/pages/MedicinesPage'

export const Route = createFileRoute('/medicines')({
  component: MedicinesPage,
})
