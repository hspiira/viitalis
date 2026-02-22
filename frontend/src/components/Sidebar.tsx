import { Link, useLocation } from '@tanstack/react-router'
import { ArrowRight } from 'lucide-react'
import {
  SIDEBAR_CATEGORIES,
  getSidebarCategoryByPath,
  type NavCategory,
} from '#/config/sidebar-nav'
import { ThemeToggler } from '#/components/ThemeToggler'

/** Icon color per sidebar category for a bit of visual identity */
const CATEGORY_ICON_COLORS: Record<string, string> = {
  main: 'text-[var(--icon-primary)]',
  api: 'text-[var(--icon-accent)]',
  company: 'text-[var(--icon-primary)]',
  membership: 'text-[var(--icon-success)]',
  claims: 'text-[var(--icon-accent)]',
  providers: 'text-[var(--icon-success)]',
  catalogs: 'text-[var(--icon-warning)]',
  reports: 'text-[var(--icon-primary)]',
  banking: 'text-[var(--icon-success)]',
  reference: 'text-[var(--icon-muted)]',
}

const baseItemClass =
  'group flex w-full items-center gap-2 px-2.5 py-1.5 text-[14px] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
const activeItemClass = 'active bg-[var(--secondary)] text-[var(--foreground-active)]'

function GroupLink({
  category,
  isActive,
}: {
  category: NavCategory
  isActive: boolean
}) {
  const to = category.items[0]?.to ?? '/dashboard'
  const Icon = category.icon ?? category.items[0]?.icon
  const iconColorClass = CATEGORY_ICON_COLORS[category.id] ?? 'text-[var(--icon-muted)]'

  return (
    <Link
      to={to}
      className={`${baseItemClass} ${isActive ? activeItemClass : ''}`}
    >
      {Icon && <Icon className={`size-3.5 shrink-0 ${iconColorClass}`} aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{category.label}</span>
      <ArrowRight className="size-3.5 shrink-0 text-inherit" aria-hidden />
    </Link>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const activeCategory = getSidebarCategoryByPath(pathname)

  return (
    <aside className="fixed left-0 top-14 z-10 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--background)]">
      <div className="shrink-0 p-3 pt-4">
        <input
          type="search"
          placeholder="Search..."
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-2.5 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          aria-label="Search"
        />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-3 pt-1">
        <ul className="space-y-0">
          {SIDEBAR_CATEGORIES.map((category) => (
            <li key={category.id} data-sidebar-category={category.id}>
              <GroupLink
                category={category}
                isActive={activeCategory?.id === category.id}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer flex shrink-0 justify-end border-t border-[var(--border-subtle)] p-3">
        <ThemeToggler />
      </div>
    </aside>
  )
}
