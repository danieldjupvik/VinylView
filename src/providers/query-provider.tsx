import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import { useState, type ReactNode } from 'react'

import { createTRPCClient, trpc } from '@/lib/trpc'

/**
 * Extract the error code from a tRPC error.
 * Returns undefined if the error doesn't have a recognizable code.
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

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(createQueryClient)
  const [trpcClient] = useState(createTRPCClient)

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
