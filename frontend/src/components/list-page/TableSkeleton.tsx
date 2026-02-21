import { Skeleton } from '#/components/ui/skeleton'

interface TableSkeletonProps {
  /** Number of columns (excluding optional checkbox column). */
  columns: number
  /** Number of skeleton rows. Default 5. */
  rows?: number
  /** If true, first column is checkbox (narrow). */
  withCheckbox?: boolean
}

/**
 * Skeleton table matching list-page table layout. Use while list data is loading.
 */
export function TableSkeleton({
  columns,
  rows = 5,
  withCheckbox = false,
}: TableSkeletonProps) {
  const totalCols = withCheckbox ? columns + 1 : columns
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] shadow-none">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]/30">
            {withCheckbox && (
              <th className="w-10 py-2.5 pl-3 pr-2">
                <span className="sr-only">Select</span>
              </th>
            )}
            {Array.from({ length: columns }).map((_, i) => (
              <th
                key={i}
                className="text-left py-2.5 px-3 font-medium"
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)]">
              {withCheckbox && (
                <td className="py-2.5 pl-3 pr-2">
                  <Skeleton className="h-4 w-4" />
                </td>
              )}
              {Array.from({ length: columns }).map((_, j) => (
                <td key={j} className="py-2.5 px-3">
                  <Skeleton className="h-4 w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
