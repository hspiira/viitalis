import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/docs')({
  component: DocsPage,
})

function DocsPage() {
  return (
    <div className="px-8 py-12 max-w-4xl">
      <h1 className="text-2xl font-semibold text-[var(--foreground)] mb-2">API Docs</h1>
      <p className="text-[var(--foreground-muted)] mb-6">
        OpenAPI documentation. You can embed or link to your backend docs here.
      </p>
      <a
        href="/docs"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--primary)] underline"
      >
        Open API docs in new tab
      </a>
    </div>
  )
}
