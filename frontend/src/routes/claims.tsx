import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/claims')({
  component: ClaimsPage,
})

function ClaimsPage() {
  return (
    <div className="px-8 py-12 max-w-4xl">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Claims</h1>
      <p className="text-[var(--foreground-muted)]">Claims management — coming soon.</p>
    </div>
  )
}
