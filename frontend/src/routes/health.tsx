import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
  component: HealthPage,
})

function HealthPage() {
  return (
    <div className="px-8 py-12 max-w-4xl">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">Health</h1>
      <p className="text-[var(--foreground-muted)]">
        Backend health check. You can add a client-side health status widget here.
      </p>
    </div>
  )
}
