/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import AppLayout from '#/components/AppLayout'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { NotFound } from '#/components/NotFound'
import { AuthProvider, useAuth } from '#/lib/auth-context'
import '#/styles.css'

export const Route = createRootRoute({
  notFoundComponent: () => <NotFound fullPage />,
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Vitalis — Healthcare Management' },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
})

function RootComponent() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootWithAuth />
      </AuthProvider>
    </ErrorBoundary>
  )
}

/** Document shell (Timeline-style). Route content is {children}; client navigation only swaps that. */
function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('vitalis-theme');if(t!=='light')document.documentElement.classList.add('dark');else document.documentElement.classList.remove('dark');})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}

/** Layout by auth state only (Timeline-style): when user is set show AppLayout, else just Outlet for login/register/landing. */
function RootWithAuth() {
  const { user, isLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Avoid hydration mismatch: server and first client render both show Outlet when no user.
  // Only after mount do we show loading (client may have token in localStorage; server never does).
  if (!mounted) {
    return <Outlet />
  }

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Loading…</p>
      </div>
    )
  }

  if (user) {
    return (
      <AppLayout>
        <Outlet />
      </AppLayout>
    )
  }

  return <Outlet />
}
