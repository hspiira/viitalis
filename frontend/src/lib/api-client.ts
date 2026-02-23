/**
 * REST API client for Vitalis backend (FastAPI).
 * Typed client from OpenAPI (vitalis-api.ts). Sends Authorization: Bearer and X-Tenant-ID.
 *
 * - vitalisApi: typed namespace (auth, users, tenants, …) — use for new code.
 * - apiGet / apiPost / etc.: legacy helpers for existing callers; prefer vitalisApi where possible.
 * - Run `pnpm run generate:api` (with backend up) to regenerate src/lib/vitalis-api.ts.
 */

import createClient from 'openapi-fetch'
import type { paths, components } from './vitalis-api'

const baseUrl =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  ''
// When VITE_API_URL is not set, default to backend in dev so /api/v1/* requests don't hit the Vite server (404).
const API_BASE = baseUrl
  ? baseUrl.replace(/\/$/, '')
  : typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { DEV?: boolean } }).env?.DEV
    ? 'http://localhost:8000'
    : ''

export function getApiBase(): string {
  return API_BASE
}

let authToken: string | null = null
let tenantId: string | null = null

if (typeof window !== 'undefined') {
  try {
    authToken = localStorage.getItem('vitalis-auth-token')
  } catch {
    // ignore
  }
}

export function setAuthToken(token: string | null) {
  authToken = token
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('vitalis-auth-token', token)
    else localStorage.removeItem('vitalis-auth-token')
  }
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('vitalis-auth-token')
  }
  return authToken
}

export function setTenantId(id: string | null) {
  tenantId = id
}

export function getTenantId(): string | null {
  return tenantId ?? null
}

const client = createClient<paths>({
  baseUrl: API_BASE || 'http://localhost:8000',
})

client.use({
  onRequest({ request }: { request: Request }) {
    const token = getAuthToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    const tid = getTenantId()
    if (tid) request.headers.set('X-Tenant-ID', tid)
    if (
      request.method === 'POST' &&
      request.url.includes('/api/v1/tenants')
    ) {
      const raw =
        typeof import.meta !== 'undefined' &&
        (import.meta as { env?: { VITE_CREATE_TENANT_SECRET?: string } }).env
          ?.VITE_CREATE_TENANT_SECRET
      const secret = typeof raw === 'string' ? raw.trim() : ''
      if (secret) request.headers.set('X-Create-Tenant-Secret', secret)
    }
    if (request.body && !(request.body instanceof FormData)) {
      request.headers.set('Content-Type', 'application/json')
    } else if (request.body instanceof FormData) {
      request.headers.delete('Content-Type')
    }
    return request
  },
})

/** Typed API namespace (Timeline-style). Use for auth, users, tenants, etc. */
export const vitalisApi = {
  auth: {
    login: (tenant_code: string, username: string, password: string) =>
      client.POST('/api/v1/auth/login', {
        body: { tenant_code, username, password },
      }),
  },
  users: {
    me: () => client.GET('/api/v1/auth/me'),
    updateMe: (data: components['schemas']['MeUpdateRequest']) =>
      client.PATCH('/api/v1/auth/me', { body: data }),
    permissions: () => client.GET('/api/v1/auth/me/permissions'),
  },
  health: {
    get: () => client.GET('/api/v1/health'),
  },
  tenants: {
    list: () => client.GET('/api/v1/tenants'),
    get: (tenantId: string) =>
      client.GET('/api/v1/tenants/{tenant_id}', {
        params: { path: { tenant_id: tenantId } },
      }),
    create: (data: components['schemas']['TenantCreateRequest']) =>
      client.POST('/api/v1/tenants', { body: data }),
  },
}

// --- Legacy helpers (same behaviour as before; use vitalisApi in new code) ---

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  token?: string | null
  tenantId?: string | null
  headers?: Record<string, string>
}

export interface ApiError {
  status: number
  detail: string | { message?: string; detail?: string }
}

function getDetail(err: ApiError): string {
  if (typeof err.detail === 'string') return err.detail
  return err.detail?.message ?? err.detail?.detail ?? 'Request failed'
}

/** Get a user-facing error string from an unknown thrown value or openapi-fetch error. */
export function getApiErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'detail' in err) return getDetail(err as ApiError)
  if (err && typeof err === 'object' && 'message' in err)
    return String((err as { message: unknown }).message)
  return err instanceof Error ? err.message : 'Request failed'
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, tenantId: optsTenantId, headers: extra = {} } = options
  const base = getApiBase()
  const url = path.startsWith('http')
    ? path
    : `${base}/api/v1${path.startsWith('/') ? path : `/${path}`}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  const t = token ?? getAuthToken()
  const tid = optsTenantId ?? getTenantId()
  if (t) headers['Authorization'] = `Bearer ${t}`
  if (tid) headers['X-Tenant-ID'] = tid

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  const text = await res.text()
  let detail: unknown
  try {
    detail = text ? JSON.parse(text) : {}
  } catch {
    detail = { detail: text || res.statusText }
  }

  if (!res.ok) {
    const d = detail as { detail?: string; message?: string }
    const err: ApiError = {
      status: res.status,
      detail: d?.detail ?? d?.message ?? res.statusText,
    }
    throw err
  }

  return (text ? JSON.parse(text) : null) as T
}

export function apiGet<T>(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...opts, method: 'GET' })
}
export function apiPost<T>(
  path: string,
  body?: unknown,
  opts?: Omit<ApiOptions, 'method' | 'body'>
) {
  return apiRequest<T>(path, { ...opts, method: 'POST', body })
}
export function apiPatch<T>(
  path: string,
  body?: unknown,
  opts?: Omit<ApiOptions, 'method' | 'body'>
) {
  return apiRequest<T>(path, { ...opts, method: 'PATCH', body })
}
export function apiPut<T>(
  path: string,
  body?: unknown,
  opts?: Omit<ApiOptions, 'method' | 'body'>
) {
  return apiRequest<T>(path, { ...opts, method: 'PUT', body })
}
export function apiDelete(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<unknown>(path, { ...opts, method: 'DELETE' })
}
