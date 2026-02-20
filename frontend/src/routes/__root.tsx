/// <reference types="vite/client" />
import type { ReactNode } from 'react'
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
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <ErrorBoundary>
        <AuthProvider>
          <RootWithAuth />
        </AuthProvider>
      </ErrorBoundary>
    </RootDocument>
  )
}

/** Layout by auth state only (Timeline-style): when user is set show AppLayout, else just Outlet for login/register/landing. */
function RootWithAuth() {
  const { user, isLoading } = useAuth()

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
