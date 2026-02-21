import {
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
  Receipt,
  Database,
  Tag,
  UsersRound,
  MapPin,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = { to: string; label: string; icon: LucideIcon }

export type NavCategory = {
  id: string
  label: string
  icon?: LucideIcon
  items: NavItem[]
}

/**
 * Sidebar navigation categories (ids align with Nmicros.hms grouping).
 * Use category id to access children: getCategoryById('claims').items
 */
export const SIDEBAR_CATEGORIES: NavCategory[] = [
  {
    id: 'main',
    label: 'Main',
    icon: Home,
    items: [{ to: '/dashboard', label: 'Introduction', icon: Home }],
  },
  {
    id: 'api',
    label: 'API',
    icon: BookOpen,
    items: [
      { to: '/docs', label: 'API Docs', icon: BookOpen },
      { to: '/health', label: 'Health', icon: Heart },
    ],
  },
  {
    id: 'company',
    label: 'Company',
    icon: Building2,
    items: [
      { to: '/companies', label: 'Companies', icon: Building2 },
      { to: '/company-types', label: 'Company types', icon: Tag },
      { to: '/company-groups', label: 'Company groups', icon: UsersRound },
      { to: '/company-branches', label: 'Branches', icon: MapPin },
    ],
  },
  {
    id: 'membership',
    label: 'Membership',
    icon: Users,
    items: [{ to: '/members', label: 'Members', icon: Users }],
  },
  {
    id: 'claims',
    label: 'Claims',
    icon: FileCheck,
    items: [
      { to: '/claims', label: 'Claims', icon: FileCheck },
      { to: '/claim-payments', label: 'Claim payments', icon: FileCheck },
    ],
  },
  {
    id: 'providers',
    label: 'Service providers',
    icon: Stethoscope,
    items: [
      { to: '/hospitals', label: 'Hospitals', icon: Building2 },
      { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    ],
  },
  {
    id: 'catalogs',
    label: 'Catalogs',
    icon: Pill,
    items: [
      { to: '/medicines', label: 'Medicines', icon: Pill },
      { to: '/services', label: 'Services', icon: Stethoscope },
      { to: '/labs', label: 'Labs', icon: FlaskConical },
      { to: '/diagnoses', label: 'Diagnoses', icon: ClipboardList },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: BarChart3,
    items: [{ to: '/reports', label: 'Reports', icon: BarChart3 }],
  },
  {
    id: 'banking',
    label: 'Banking & billing',
    icon: Landmark,
    items: [
      { to: '/banks', label: 'Banks', icon: Landmark },
      { to: '/reimbursements', label: 'Reimbursements', icon: Receipt },
      { to: '/billing-sessions', label: 'Billing sessions', icon: FolderOpen },
    ],
  },
  {
    id: 'reference',
    label: 'Reference',
    icon: Database,
    items: [
      { to: '/reference-data', label: 'Reference data', icon: Database },
      { to: '/card-replacements', label: 'Card replacements', icon: CreditCard },
    ],
  },
]

/** Get a sidebar category by id to access its children. */
export function getSidebarCategoryById(id: string): NavCategory | undefined {
  return SIDEBAR_CATEGORIES.find((c) => c.id === id)
}

/** Get the category that contains the given path. */
export function getSidebarCategoryByPath(pathname: string): NavCategory | undefined {
  const norm = pathname.replace(/^\/+/, '').split('/')[0] ?? ''
  for (const cat of SIDEBAR_CATEGORIES) {
    const hasMatch = cat.items.some((item) => {
      const itemPath = item.to.replace(/^\/+/, '').split('/')[0] ?? ''
      return item.to === pathname || itemPath === norm || pathname.startsWith(item.to + '/')
    })
    if (hasMatch) return cat
  }
  return undefined
}
