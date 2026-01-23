import { QueryClient, keepPreviousData } from '@tanstack/react-query'
import { createTRPCReact, httpBatchLink } from '@trpc/react-query'

import type { AppRouter } from '@/server/trpc/index.ts'

/**
 * TanStack Query client with IndexedDB persistence.
 * All queries automatically persist to IndexedDB and show previous data during refetch.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      placeholderData: keepPreviousData // Show old data during refetch
    }
  }
})

/**
 * tRPC React client instance.
 * Use this to call tRPC procedures from React components.
 *
 * @example
 * ```tsx
 * const getRequestToken = trpc.oauth.getRequestToken.useMutation()
 * await getRequestToken.mutateAsync({ callbackUrl: '...' })
 * ```
 */
export const trpc = createTRPCReact<AppRouter>()

/**
 * Get the tRPC client links configuration.
 * Uses httpBatchLink to batch multiple requests together.
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return ''
  }
  return 'http://localhost:3000'
}

/**
 * Creates a tRPC client for use outside of React components.
 * This is useful for calling tRPC procedures in non-React contexts.
 *
 * Uses methodOverride: 'POST' to send all queries as POST requests,
 * keeping OAuth tokens in request body instead of URL parameters.
 */
export function createTRPCClient(): ReturnType<typeof trpc.createClient> {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        methodOverride: 'POST' // Send all queries as POST for security
      })
    ]
  })
}
