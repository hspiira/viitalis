import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from './auth-context'

/**
 * Redirects authenticated users to the given path (default '/dashboard').
 * Used on login/register pages so already-authenticated users are sent to the app.
 */
export function useRedirectIfAuthenticated(redirectTo = '/dashboard') {
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      navigate({ to: redirectTo })
    }
  }, [user, navigate, redirectTo])

  return !!user
}
