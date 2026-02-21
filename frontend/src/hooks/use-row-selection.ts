import { useState, useCallback } from 'react'

export interface UseRowSelectionResult {
  selectedIds: Set<string>
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>
  toggleAll: (currentPageIds: string[]) => void
  toggleOne: (id: string) => void
  clearSelection: () => void
}

/**
 * Encapsulates row selection state for list views (e.g. tables with checkboxes).
 * Caller derives allSelected/someSelected from selectedIds and current page items.
 */
export function useRowSelection(): UseRowSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggleAll = useCallback((currentPageIds: string[]) => {
    setSelectedIds((prev) => {
      const allSelected = currentPageIds.length > 0 && currentPageIds.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set(currentPageIds)
    })
  }, [])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  return { selectedIds, setSelectedIds, toggleAll, toggleOne, clearSelection }
}

/** Derive whether all current page rows are selected. */
export function isAllSelected(currentPageIds: string[], selectedIds: Set<string>): boolean {
  return currentPageIds.length > 0 && selectedIds.size === currentPageIds.length
}
