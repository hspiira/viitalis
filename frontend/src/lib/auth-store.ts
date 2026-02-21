/**
 * Auth state: token + current user (with tenant_id for X-Tenant-ID).
 * Uses vitalisApi (typed OpenAPI client) for login and GET /auth/me.
 * Syncs token/tenant to api-client so requests send Authorization and X-Tenant-ID.
 */

import {
  vitalisApi,
  setAuthToken,
  setTenantId,
  getApiErrorDetail,
} from '@/lib/api-client'

const STORAGE_KEY = 'vitalis-auth-token'

export interface MeUser {
  id: string
  tenant_id: string
  username: string
  email: string | null
  is_active: boolean
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  remarks: string | null
}

let token: string | null = null
let user: MeUser | null = null

function readStorage(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function writeStorage(value: string | null) {
  if (typeof window === 'undefined') return
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value)
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function getStoredToken(): string | null {
  return token ?? readStorage()
}

export function getAuthUser(): MeUser | null {
  return user
}

export function getTenantId(): string | null {
  return user?.tenant_id ?? null
}

export function isAuthenticated(): boolean {
  return !!getStoredToken()
}

export function setAuth(newToken: string, newUser: MeUser | null = null) {
  token = newToken
  user = newUser
  writeStorage(newToken)
  setAuthToken(newToken)
  if (newUser?.tenant_id) setTenantId(newUser.tenant_id)
  else if (!newToken) setTenantId(null)
}

/** Set token only (e.g. right after login). Call fetchMe() to populate user. */
export function setToken(newToken: string) {
  token = newToken
  writeStorage(newToken)
  setAuthToken(newToken)
}

export function clearAuth() {
  token = null
  user = null
  writeStorage(null)
  setAuthToken(null)
  setTenantId(null)
}

/** Load token from storage (e.g. on app init). Does not fetch user. */
export function loadStoredToken(): string | null {
  token = readStorage()
  return token
}

/** Fetch current user from GET /auth/me and store. Call after login or on app load when token exists. */
export async function fetchMe(): Promise<MeUser | null> {
  const t = getStoredToken()
  if (!t) return null
  try {
    const { data, error } = await vitalisApi.users.me()
    if (error || !data) {
      clearAuth()
      return null
    }
    user = data as MeUser
    setTenantId(data.tenant_id)
    return user
  } catch {
    clearAuth()
    return null
  }
}

/** Call login API and return access token. Throws on failure. */
export async function loginWithPassword(
  tenant_code: string,
  username: string,
  password: string
): Promise<string> {
  const { data, error } = await vitalisApi.auth.login(
    tenant_code.trim(),
    username.trim(),
    password
  )
  if (error) {
    const detail =
      (error as { detail?: string; message?: string })?.detail ??
      (error as { detail?: string; message?: string })?.message
    throw Object.assign(new Error(typeof detail === 'string' ? detail : 'Login failed'), {
      detail,
    })
  }
  if (!data?.access_token) throw new Error('Login failed')
  return data.access_token
}

/** Get user-facing error message from a login/API error. */
export function getLoginErrorDetail(err: unknown): string {
  return getApiErrorDetail(err) || 'Login failed. Please try again.'
}
