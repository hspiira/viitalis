/**
 * Single row for detail dialogs (label + value). Shared across list pages (companies, claims, etc.).
 */
export function DetailRow({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <>
      <dt className="text-[var(--foreground-muted)]">{label}</dt>
      <dd className="text-[var(--foreground)]">{value || '—'}</dd>
    </>
  )
}
