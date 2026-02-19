import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Heart,
  Home,
  Building2,
  Users,
  FileCheck,
  BarChart3,
  Pill,
  Stethoscope,
  FlaskConical,
  ClipboardList,
  Landmark,
  CreditCard,
  FolderOpen,
  Moon,
  Sun,
  Receipt,
  Database,
  type LucideIcon,
} from 'lucide-react'

const THEME_KEY = 'vitalis-theme'

function ThemeToggler() {
  const [isDark, setIsDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY)
    const dark = stored !== 'light'
    setIsDark(dark)
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem(THEME_KEY, 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem(THEME_KEY, 'light')
    }
  }

  return (
    <div className="sidebar-footer flex shrink-0 justify-end border-t border-[var(--border-subtle)] p-3">
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className="flex items-center"
      >
        <span className="relative inline-flex h-1.5 w-9 shrink-0 rounded-full bg-[var(--muted)]">
          <span
            className={`absolute top-1/2 size-4 -translate-y-1/2 rounded-full border border-[var(--border-subtle)] bg-[var(--secondary)] shadow transition-[left] duration-200 ${
              isDark ? 'left-5' : 'left-0.5'
            }`}
          >
            {isDark ? (
              <Moon className="absolute inset-0 m-auto size-2.5 text-[var(--foreground-active)]" aria-hidden />
            ) : (
              <Sun className="absolute inset-0 m-auto size-2.5 text-[var(--foreground-active)]" aria-hidden />
            )}
          </span>
        </span>
      </button>
    </div>
  )
}

type NavItem = { to: string; label: string; icon: LucideIcon }

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { to: '/', label: 'Introduction', icon: Home },
    ],
  },
  {
    label: 'API',
    items: [
      { to: '/docs', label: 'API Docs', icon: BookOpen },
      { to: '/health', label: 'Health', icon: Heart },
    ],
  },
  {
    label: 'Core',
    items: [
      { to: '/tenants', label: 'Tenants', icon: Building2 },
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/members', label: 'Members', icon: Users },
      { to: '/claims', label: 'Claims', icon: FileCheck },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/hospitals', label: 'Hospitals', icon: Building2 },
      { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    ],
  },
  {
    label: 'Catalogs',
    items: [
      { to: '/medicines', label: 'Medicines', icon: Pill },
      { to: '/services', label: 'Services', icon: Stethoscope },
      { to: '/labs', label: 'Labs', icon: FlaskConical },
      { to: '/diagnoses', label: 'Diagnoses', icon: ClipboardList },
    ],
  },
  {
    label: 'Reference & Banking',
    items: [
      { to: '/banks', label: 'Banks', icon: Landmark },
      { to: '/reimbursements', label: 'Reimbursements', icon: Receipt },
      { to: '/reference-data', label: 'Reference data', icon: Database },
      { to: '/card-replacements', label: 'Card replacements', icon: CreditCard },
      { to: '/billing-sessions', label: 'Billing sessions', icon: FolderOpen },
      { to: '/claim-payments', label: 'Claim payments', icon: FileCheck },
    ],
  },
]

function SidebarItem({ item }: { item: NavItem }) {
  const Icon = item.icon
  const content = (
    <>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Icon className="size-3.5 shrink-0 text-inherit" aria-hidden />
        <span className="min-w-0 truncate">{item.label}</span>
      </div>
      <ArrowRight className="size-3.5 shrink-0 ml-auto text-inherit" aria-hidden />
    </>
  )
  const baseClass =
    'group flex w-full items-center gap-2 px-2.5 py-1.5 text-[14px] text-[var(--foreground-muted)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]'
  const activeClass = 'active bg-[var(--secondary)] text-[var(--foreground-active)]'

  return (
    <Link
      to={item.to}
      className={baseClass}
      activeProps={{ className: `${baseClass} ${activeClass}` }}
    >
      {content}
    </Link>
  )
}

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-14 z-10 flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-[var(--border-subtle)] bg-[var(--background)]">
      <div className="shrink-0 p-3">
        <input
          type="search"
          placeholder="Search..."
          className="w-full border border-[var(--input)] bg-[var(--secondary)] px-2.5 py-1.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none"
          aria-label="Search"
        />
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <h3 className="mb-1.5 px-2.5 text-xs font-semibold text-[var(--foreground-subtle)]">
              {group.label}
            </h3>
            <ul className="space-y-0">
              {group.items.map((item) => (
                <li key={item.label}>
                  <SidebarItem item={item} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <ThemeToggler />
    </aside>
  )
}
