/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import AppLayout from '#/components/AppLayout'
import { AuthGuard } from '#/components/AuthGuard'
import { ErrorBoundary } from '#/components/ErrorBoundary'
import { NotFound } from '#/components/NotFound'
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
        <AuthGuard>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </AuthGuard>
      </ErrorBoundary>
    </RootDocument>
  )
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
