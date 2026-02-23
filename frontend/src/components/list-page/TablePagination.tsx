import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100]

export interface TablePaginationProps {
  /** Current offset (skip). */
  skip: number
  /** Page size (limit). */
  limit: number
  /** Number of items on current page. */
  currentPageSize: number
  /** Total number of items (optional). When provided, shows "out of N" and enables last page / full page numbers. */
  totalCount?: number
  /** Page size options for the dropdown. */
  pageSizeOptions?: number[]
  /** Called when skip changes (e.g. user goes to next page). */
  onSkipChange: (skip: number) => void
  /** Called when limit (page size) changes. Optional; when not provided, per-page dropdown is hidden. */
  onLimitChange?: (limit: number) => void
  /** Optional class for the wrapper. */
  className?: string
}

/**
 * Full table pagination: first / prev / next / last, page numbers with ellipsis,
 * "Go to page" input, and "showing [N] items out of [total]" with per-page dropdown.
 */
export function TablePagination({
  skip,
  limit,
  currentPageSize,
  totalCount,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  onSkipChange,
  onLimitChange,
  className,
}: TablePaginationProps) {
  const [goToPageInput, setGoToPageInput] = useState('')

  const totalPages =
    totalCount != null && totalCount > 0
      ? Math.max(1, Math.ceil(totalCount / limit))
      : null
  const currentPage = Math.floor(skip / limit) + 1

  const goToFirst = useCallback(() => onSkipChange(0), [onSkipChange])
  const goToPrev = useCallback(
    () => onSkipChange(Math.max(0, skip - limit)),
    [onSkipChange, skip, limit]
  )
  const goToNext = useCallback(
    () => onSkipChange(skip + limit),
    [onSkipChange, skip, limit]
  )
  const goToLast = useCallback(() => {
    if (totalPages != null) onSkipChange((totalPages - 1) * limit)
  }, [onSkipChange, totalPages, limit])

  const goToPage = useCallback(
    (page: number) => {
      const p = Math.max(1, Math.min(page, totalPages ?? page))
      onSkipChange((p - 1) * limit)
    },
    [onSkipChange, limit, totalPages]
  )

  const handleGoToSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(goToPageInput, 10)
    if (!Number.isNaN(n)) {
      goToPage(n)
      setGoToPageInput('')
    }
  }

  const hasPrev = skip > 0
  const hasNext = totalPages != null ? currentPage < totalPages : currentPageSize >= limit
  const hasLast = totalPages != null && totalPages > 1

  // Build page number buttons: 1, 2, current, ..., last (or just a few around current)
  const pageNumbers: (number | 'ellipsis')[] = []
  if (totalPages != null && totalPages > 0) {
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i)
    } else {
      pageNumbers.push(1)
      if (currentPage > 3) pageNumbers.push('ellipsis')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) pageNumbers.push(i)
      }
      if (currentPage < totalPages - 2) pageNumbers.push('ellipsis')
      if (totalPages > 1) pageNumbers.push(totalPages)
    }
  } else {
    pageNumbers.push(currentPage)
  }

  const displayTotal = totalCount ?? Math.max(skip + currentPageSize, 1)

  return (
    <div className={cn('flex flex-col gap-3 py-3', className)}>
      {/* Row 1: First, Prev, page numbers, Next, Last, Go to page */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md"
          onClick={goToFirst}
          disabled={!hasPrev}
          aria-label="First page"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md"
          onClick={goToPrev}
          disabled={!hasPrev}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) =>
            p === 'ellipsis' ? (
              <span
                key={`ellipsis-${i}`}
                className="flex h-8 min-w-[2rem] items-center justify-center rounded-md px-2 text-sm text-[var(--foreground-muted)]"
                aria-hidden
              >
                ..
              </span>
            ) : (
              <Button
                key={p}
                type="button"
                variant={currentPage === p ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-8 min-w-[2rem] rounded-md px-2',
                  currentPage === p &&
                    'bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/90'
                )}
                onClick={() => goToPage(p)}
                aria-label={currentPage === p ? `Page ${p} (current)` : `Page ${p}`}
                aria-current={currentPage === p ? 'page' : undefined}
              >
                {p}
              </Button>
            )
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md"
          onClick={goToNext}
          disabled={!hasNext}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-md"
          onClick={goToLast}
          disabled={!hasLast || !hasNext}
          aria-label="Last page"
        >
          <ChevronsRight className="size-4" />
        </Button>

        <form
          onSubmit={handleGoToSubmit}
          className="ml-2 flex items-center gap-1 rounded-md border border-[var(--input)] bg-[var(--background)]"
        >
          <label htmlFor="pagination-goto" className="sr-only">
            Go to page
          </label>
          <input
            id="pagination-goto"
            type="number"
            min={1}
            max={totalPages ?? undefined}
            value={goToPageInput}
            onChange={(e) => setGoToPageInput(e.target.value)}
            placeholder="Go to page"
            className="h-8 w-20 rounded-l-md border-0 bg-transparent px-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            aria-label="Go to page number"
          />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="h-8 rounded-l-none rounded-r-md px-2 text-[var(--foreground-muted)]"
          >
            Go &gt;
          </Button>
        </form>
      </div>

      {/* Row 2: Showing [dropdown] items out of [total] */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--foreground-muted)]">
        <span className="shrink-0">showing</span>
        {onLimitChange ? (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="h-8 rounded-md border border-[var(--input)] bg-[var(--background)] px-2 py-1 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            aria-label="Items per page"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : (
          <span className="font-medium text-[var(--foreground)]">{limit}</span>
        )}
        <span className="shrink-0">items out of {displayTotal}</span>
      </div>
    </div>
  )
}
