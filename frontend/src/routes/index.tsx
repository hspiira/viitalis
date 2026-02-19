import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="px-8 py-12 max-w-4xl">
      <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)] mb-4">
        A modern API platform for healthcare management.
      </h1>
      <p className="text-lg text-[var(--foreground-muted)] mb-8">
        Industry-leading API backend for members, claims, and reporting that your
        healthcare workflows deserve.
      </p>
      <div className="flex gap-4">
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Get Started
        </a>
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-[var(--border)] bg-[var(--secondary)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] hover:opacity-90"
        >
          API Docs
        </a>
      </div>

      <div className="mt-16 border-t border-[var(--border)] pt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)] mb-4">
          API
        </h2>
        <div className="flex gap-6">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)]"
          >
            API Docs
          </a>
          <a
            href="/api/v1/health"
            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--primary)]"
          >
            Health
          </a>
        </div>
      </div>
    </div>
  )
}
