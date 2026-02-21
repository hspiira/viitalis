import type { ReactNode } from 'react'
import Header from '#/components/Header'
import Sidebar from '#/components/Sidebar'
import GroupTabs from '#/components/GroupTabs'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <Header />
      <div className="relative mt-14 flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-h-0 flex-1 overflow-auto pl-64 flex flex-col min-w-0">
          <GroupTabs />
          <div className="w-full min-w-0 flex-1 px-4 py-3">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
