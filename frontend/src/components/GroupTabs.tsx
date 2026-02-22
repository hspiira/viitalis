import { Link, useLocation } from '@tanstack/react-router'
import { getSidebarCategoryByPath } from '#/config/sidebar-nav'

/**
 * Renders tabs for the current group when the route belongs to a category
 * with more than one item. Shown at the top of the main content area.
 */
export default function GroupTabs() {
  const { pathname } = useLocation()
  const category = getSidebarCategoryByPath(pathname)

  if (!category || category.items.length <= 1) return null
  // Service providers use in-page tabs (Hospital Management | Doctor Management); hide this row.
  if (category.id === 'providers') return null

  const baseTab =
    'px-4 py-2 text-sm font-medium border-b-2 transition-colors'
  const inactiveTab =
    'border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--border-subtle)]'
  const activeTab =
    'border-[var(--primary)] text-[var(--foreground-active)]'

  return (
    <div className="border-b border-[var(--border-subtle)] bg-[var(--background)]">
      <nav className="flex gap-1" aria-label={`${category.label} sections`}>
        {category.items.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(item.to + '/')
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`${baseTab} ${isActive ? activeTab : inactiveTab}`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
