/**
 * REST API client for Vitalis backend (FastAPI).
 * Sends Authorization: Bearer and X-Tenant-ID when provided.
 */

const API_BASE =
  (typeof import.meta !== 'undefined' &&
    (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  ''

export function getApiBase(): string {
  return API_BASE ? API_BASE.replace(/\/$/, '') : ''
}

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

/** Get a user-facing error string from an unknown thrown value (e.g. from apiRequest). */
export function getApiErrorDetail(err: unknown): string {
  if (err && typeof err === 'object' && 'detail' in err) return getDetail(err as ApiError)
  return err instanceof Error ? err.message : 'Request failed'
}

export async function apiRequest<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, tenantId, headers: extra = {} } = options
  const base = getApiBase()
  const url = path.startsWith('http') ? path : `${base}/api/v1${path.startsWith('/') ? path : `/${path}`}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (tenantId) headers['X-Tenant-ID'] = tenantId

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
export function apiPost<T>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...opts, method: 'POST', body })
}
export function apiPatch<T>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...opts, method: 'PATCH', body })
}
export function apiPut<T>(path: string, body?: unknown, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<T>(path, { ...opts, method: 'PUT', body })
}
export function apiDelete(path: string, opts?: Omit<ApiOptions, 'method' | 'body'>) {
  return apiRequest<unknown>(path, { ...opts, method: 'DELETE' })
}

