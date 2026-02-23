import { Button } from '#/components/ui/button'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from '#/components/ui/pagination'

interface ListPagePaginationProps {
  /** Current offset (skip). */
  skip: number
  /** Page size (limit). */
  limit: number
  /** Number of items on current page (if < limit, Next is disabled). */
  currentPageSize: number
  onPrevious: () => void
  onNext: () => void
}

/**
 * Previous / page indicator / Next. Used by companies, claims, members, etc.
 */
export function ListPagePagination({
  skip,
  limit,
  currentPageSize,
  onPrevious,
  onNext,
}: ListPagePaginationProps) {
  const page = Math.floor(skip / limit) + 1
  return (
    <div className="flex items-center justify-end gap-2 py-2">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              disabled={skip === 0}
            >
              Previous
            </Button>
          </PaginationItem>
          <PaginationItem>
            <span className="px-2 text-sm text-[var(--foreground-muted)]">
              {page}
            </span>
          </PaginationItem>
          <PaginationItem>
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              disabled={currentPageSize < limit}
            >
              Next
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
