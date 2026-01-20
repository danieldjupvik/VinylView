import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState, type ReactNode } from 'react'

import { trpc } from '@/lib/trpc'

/**
 * Creates a test QueryClient with no retries for faster test execution.
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0
      },
      mutations: {
        retry: false
      }
    }
  })
}

/**
 * Creates a test tRPC client that connects to MSW-mocked /api/trpc endpoints.
 */
function createTestTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: 'http://localhost:3000/api/trpc'
      })
    ]
  })
}

interface TRPCTestProviderProps {
  children: ReactNode
}

/**
 * Test provider that wraps components with tRPC and QueryClient.
 * Uses MSW to mock tRPC endpoints at /api/trpc.
 */
export function TRPCTestProvider({ children }: TRPCTestProviderProps) {
  const [queryClient] = useState(createTestQueryClient)
  const [trpcClient] = useState(createTestTRPCClient)

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

/**
 * Creates a wrapper component for renderHook that includes tRPC and QueryClient.
 */
export function createTRPCWrapper() {
  const queryClient = createTestQueryClient()
  const trpcClient = createTestTRPCClient()

  return function TRPCWrapper({ children }: { children: ReactNode }) {
    return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
    )
  }
}
