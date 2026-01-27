import { TRPCClientError } from '@trpc/client'

/**
 * Custom error for offline state without cached profile.
 * Thrown when user tries to continue session while offline
 * but has no cached profile data to work with.
 */
export class OfflineNoCacheError extends Error {
  constructor() {
    super('Cannot continue offline without cached profile')
    this.name = 'OfflineNoCacheError'
  }
}

/**
 * Extracts the tRPC error code from a TRPCClientError.
 * Returns undefined if the error is not a TRPCClientError or has no code.
 */
function getTRPCErrorCode(error: unknown): string | undefined {
  if (!(error instanceof TRPCClientError)) {
    return undefined
  }
  const data: unknown = error.data
  if (typeof data === 'object' && data !== null && 'code' in data) {
    const code = (data as { code: unknown }).code
    return typeof code === 'string' ? code : undefined
  }
  return undefined
}

/**
 * Checks if an error indicates invalid OAuth tokens.
 * Returns true for UNAUTHORIZED (401) and FORBIDDEN (403) errors.
 * Returns false for transient errors (5xx, network issues) that should not trigger logout.
 */
export function isAuthError(error: unknown): boolean {
  const code = getTRPCErrorCode(error)
  return code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
}

/**
 * Checks if an error should not be retried.
 * Returns true for errors where retrying would not help:
 * - UNAUTHORIZED (401) - Invalid credentials
 * - FORBIDDEN (403) - Insufficient permissions
 * - NOT_FOUND (404) - Resource doesn't exist
 * - TOO_MANY_REQUESTS (429) - Rate limited
 */
export function isNonRetryableError(error: unknown): boolean {
  const code = getTRPCErrorCode(error)
  return (
    code === 'UNAUTHORIZED' ||
    code === 'FORBIDDEN' ||
    code === 'NOT_FOUND' ||
    code === 'TOO_MANY_REQUESTS'
  )
}
