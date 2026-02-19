/**
 * Auth state: token + current user (with tenant_id for X-Tenant-ID).
 * Persists token to localStorage; user is refreshed from GET /auth/me.
 */

import { apiGet } from '#/lib/api-client'

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
}

/** Set token only (e.g. right after login). Call fetchMe() to populate user. */
export function setToken(newToken: string) {
  token = newToken
  writeStorage(newToken)
}

export function clearAuth() {
  token = null
  user = null
  writeStorage(null)
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
    const me = await apiGet<MeUser>('/auth/me', { token: t })
    user = me
    return me
  } catch {
    clearAuth()
    return null
  }
}
