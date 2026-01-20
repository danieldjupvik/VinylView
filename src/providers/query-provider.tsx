import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { useState, type ReactNode } from 'react'

import { createTRPCClient, trpc } from '@/lib/trpc'

/**
 * Extracts the `code` property from a tRPC client error when present.
 *
 * @param error - The value to inspect for a tRPC client error.
 * @returns The string error code if found, `undefined` otherwise.
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
 * Create a configured TanStack QueryClient using application defaults.
 *
 * The client sets queries to be considered fresh for 5 minutes and applies a retry
 * policy that disables retries for tRPC error codes `UNAUTHORIZED`, `NOT_FOUND`,
 * and `TOO_MANY_REQUESTS`; for other errors it allows up to 2 retry attempts.
 *
 * @returns A configured QueryClient with the described `staleTime` and retry policy.
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry on certain tRPC error codes
          const code = getTRPCErrorCode(error)
          if (
            code === 'UNAUTHORIZED' ||
            code === 'NOT_FOUND' ||
            code === 'TOO_MANY_REQUESTS'
          ) {
            return false
          }
          return failureCount < 2
        }
      }
    }
  })
}

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Provides tRPC and TanStack Query contexts to descendant components.
 *
 * @param children - React nodes that will be rendered within the providers
 * @returns The provider tree that supplies a tRPC client and a QueryClient to `children`
 *
 * @example
 * <QueryProvider>
 *   <App />
 * </QueryProvider>
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)
  const [trpcClient] = useState(createTRPCClient)

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}