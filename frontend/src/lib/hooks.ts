import { useEffect } from 'react'
import { useAuth } from './auth-context'

/**
 * Redirects authenticated users to the given path (default '/dashboard').
 * Used on login/register pages so already-authenticated users are sent to the app.
 * Uses full page redirect to avoid SSR/fetch path that can show 404 HTML as text.
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      window.location.replace(redirectTo)
    }
  }, [user, redirectTo])

  return !!user
}
