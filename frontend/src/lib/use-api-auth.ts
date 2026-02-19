import { getStoredToken, getTenantId } from '#/lib/auth-store'

/** Returns token and tenantId for authenticated API calls. */
export function useApiAuth() {
  return {
    token: getStoredToken(),
    tenantId: getTenantId(),
  }
}
