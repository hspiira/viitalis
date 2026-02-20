/**
 * Reactive auth state for the root layout (Timeline-style).
 * Root shows AppLayout only when user is set; login/register/landing show full-bleed.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  loadStoredToken,
  fetchMe,
  clearAuth,
  setToken,
  loginWithPassword,
  getLoginErrorDetail,
  type MeUser,
} from '@/lib/auth-store'

interface AuthState {
  user: MeUser | null
  isLoading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  setUser: (user: MeUser | null) => void
  initAuth: () => Promise<void>
  logout: () => void
  login: (tenant_code: string, username: string, password: string) => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => ({
    user: null,
    isLoading: typeof window !== 'undefined' ? !!loadStoredToken() : false,
    error: null,
  }))

  const initAuth = useCallback(async () => {
    const token = loadStoredToken()
    if (!token) {
      setState({ user: null, isLoading: false })
      return
    }
    setState((s) => ({ ...s, isLoading: true }))
    const me = await fetchMe()
    setState({ user: me, isLoading: false })
  }, [])

  const setUser = useCallback((user: MeUser | null) => {
    setState((s) => ({ ...s, user, isLoading: false }))
  }, [])

  const clearError = useCallback(() => {
    setState((s) => (s.error ? { ...s, error: null } : s))
  }, [])

  const login = useCallback(
    async (tenant_code: string, username: string, password: string): Promise<boolean> => {
      setState((s) => ({ ...s, error: null, isLoading: true }))
      try {
        const token = await loginWithPassword(tenant_code, username, password)
        setToken(token)
        const me = await fetchMe()
        if (!me) {
          clearAuth()
          setState((s) => ({ ...s, isLoading: false, error: 'Could not load user profile' }))
          return false
        }
        setState({ user: me, isLoading: false, error: null })
        return true
      } catch (err) {
        clearAuth()
        const message = getLoginErrorDetail(err)
        setState((s) => ({ ...s, user: null, isLoading: false, error: message }))
        return false
      }
    },
    []
  )

  const logout = useCallback(() => {
    clearAuth()
    setState({ user: null, isLoading: false, error: null })
  }, [])

  useEffect(() => {
    initAuth()
  }, [initAuth])

  const value: AuthContextValue = {
    ...state,
    setUser,
    initAuth,
    logout,
    login,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
