import { useState } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { ArrowRight, ChevronLeft } from 'lucide-react'
import {
  SIDEBAR_CATEGORIES,
  getSidebarCategoryByPath,
  type NavCategory,
  type NavItem,
} from '#/config/sidebar-nav'
import { ThemeToggler } from '#/components/ThemeToggler'

const baseItemClass =
  'group flex w-full items-center gap-2 px-2.5 py-1.5 text-[14px] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
const activeItemClass = 'active bg-[var(--secondary)] text-[var(--foreground-active)]'

function ChildLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <Link
      to={item.to}
      className={baseItemClass}
      activeProps={{ className: `${baseItemClass} ${activeItemClass}` }}
    >
      <Icon className="size-3.5 shrink-0 text-inherit" aria-hidden />
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  )
}

function ParentRow({
  category,
  isActive,
  onClick,
}: {
  category: NavCategory
  isActive: boolean
  onClick: () => void
}) {
  const Icon = category.icon ?? category.items[0]?.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseItemClass} w-full text-left ${isActive ? activeItemClass : ''}`}
      aria-expanded={isActive}
    >
      {Icon && <Icon className="size-3.5 shrink-0 text-inherit" aria-hidden />}
      <span className="min-w-0 flex-1 truncate">{category.label}</span>
      <ArrowRight className="size-3.5 shrink-0 text-inherit" aria-hidden />
    </button>
  )
}

export default function Sidebar() {
  const [drawerCategoryId, setDrawerCategoryId] = useState<string | null>(null)
  const openCategory = drawerCategoryId
    ? SIDEBAR_CATEGORIES.find((c) => c.id === drawerCategoryId)
    : null

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
        {!openCategory ? (
          <>
            <ul className="space-y-0">
              {SIDEBAR_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <ParentRow
                    category={category}
                    isActive={activeCategory?.id === category.id}
                    onClick={() => setDrawerCategoryId(category.id)}
                  />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setDrawerCategoryId(null)}
              className="mb-2 flex w-full items-center gap-2 px-2.5 py-1.5 text-[14px] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
              aria-label="Back to menu"
            >
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              Back
            </button>
            <h3 className="mb-1.5 px-2.5 text-xs font-semibold text-[var(--foreground-subtle)]">
              {openCategory.label}
            </h3>
            <ul className="space-y-0">
              {openCategory.items.map((item) => (
                <li key={item.to}>
                  <ChildLink item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="sidebar-footer flex shrink-0 justify-end border-t border-[var(--border-subtle)] p-3">
        <ThemeToggler />
      </div>
    </aside>
  )
}
