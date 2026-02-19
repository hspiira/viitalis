/**
 * Hook that returns API options (token, tenantId) for use with api-client.
 * Use with apiGet, apiPost, apiPatch, etc. so requests are authenticated and tenant-scoped.
 */

import { getStoredToken, getTenantId } from '#/lib/auth-store'

export interface ApiOpts {
  token: string | null
  tenantId: string | null
}

export function useApi(): ApiOpts {
  return {
    token: getStoredToken(),
    tenantId: getTenantId(),
  }
}

export function getApiOpts(): ApiOpts {
  return {
    token: getStoredToken(),
    tenantId: getTenantId(),
  }
}
