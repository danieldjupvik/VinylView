import { TRPCError } from '@trpc/server'

/**
 * Type guard for errors from @lionralfs/discogs-client.
 * DiscogsError is not exported from the package, so we check for the statusCode property.
 */
export function isDiscogsError(
  error: unknown
): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as Error & { statusCode: unknown }).statusCode === 'number'
  )
}

/**
 * Type guard for fetch/network errors.
 * These occur when the request fails before reaching Discogs (network issues, DNS, timeouts).
 */
export function isNetworkError(
  error: unknown
): error is Error & { type?: string } {
  if (!(error instanceof Error)) return false
  const name = error.name.toLowerCase()
  return (
    name.includes('fetch') ||
    name.includes('abort') ||
    name.includes('network') ||
    name.includes('timeout')
  )
}

/**
 * Maps HTTP status codes to human-readable messages for common Discogs API errors.
 */
export function getStatusMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad request - invalid parameters'
    case 401:
      return 'Invalid or expired OAuth tokens'
    case 403:
      return 'Access forbidden - insufficient permissions'
    case 404:
      return 'Resource not found'
    case 429:
      return 'Rate limit exceeded - too many requests'
    case 500:
      return 'Discogs server error'
    case 502:
      return 'Discogs service unavailable (bad gateway)'
    case 503:
      return 'Discogs service temporarily unavailable'
    case 504:
      return 'Discogs request timed out (gateway timeout)'
    default:
      return `Discogs API error (HTTP ${statusCode})`
  }
}

/**
 * Maps HTTP status codes to appropriate tRPC error codes.
 */
export function getTRPCCode(
  statusCode: number
):
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'TOO_MANY_REQUESTS'
  | 'INTERNAL_SERVER_ERROR' {
  switch (statusCode) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 429:
      return 'TOO_MANY_REQUESTS'
    default:
      return 'INTERNAL_SERVER_ERROR'
  }
}

/**
 * Handles Discogs API errors and converts them to tRPC errors.
 * Provides detailed error messages including HTTP status codes for debugging.
 * Preserves the original error as `cause` for server-side debugging.
 *
 * Use this in catch blocks when calling the Discogs client:
 * ```ts
 * try {
 *   const data = await client.someMethod()
 * } catch (error) {
 *   handleDiscogsError(error, 'get user profile')
 * }
 * ```
 *
 * @param error - The caught error from the Discogs client
 * @param context - Description of what operation failed (e.g., "get collection")
 */
export function handleDiscogsError(error: unknown, context: string): never {
  // Re-throw tRPC errors as-is (already formatted)
  if (error instanceof TRPCError) {
    throw error
  }

  // Handle Discogs API errors (have statusCode)
  if (isDiscogsError(error)) {
    const statusCode = error.statusCode
    const apiMessage = error.message !== 'Unknown error.' ? error.message : null
    const statusMessage = getStatusMessage(statusCode)

    // Build descriptive message: include API message if available, always include status
    const message = apiMessage
      ? `${apiMessage} (HTTP ${statusCode})`
      : statusMessage

    throw new TRPCError({
      code: getTRPCCode(statusCode),
      message,
      cause: error
    })
  }

  // Handle network errors (fetch failures, timeouts, etc.)
  if (isNetworkError(error)) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Network error while trying to ${context}: ${error.message}`,
      cause: error
    })
  }

  // Handle unknown errors - include original message if available
  const errorMessage =
    error instanceof Error ? error.message : 'An unexpected error occurred'

  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: `Failed to ${context}: ${errorMessage}`,
    cause: error instanceof Error ? error : undefined
  })
}
