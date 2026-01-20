import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState, type ReactNode } from 'react'

import { trpc } from '@/lib/trpc'

/**
 * Create a QueryClient configured for tests with retries disabled and immediate garbage collection.
 *
 * The returned client disables retries for queries and mutations and sets query garbage collection time to 0 to avoid retained cache between tests.
 *
 * @returns A QueryClient instance configured for fast, isolated tests
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
 * Create a tRPC client configured for tests against the local `/api/trpc` endpoint.
 *
 * @returns A tRPC client that sends batched HTTP requests to `http://localhost:3000/api/trpc`
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
 * Provides tRPC and React Query contexts for tests.
 *
 * Renders `children` inside a tRPC provider and a React Query `QueryClientProvider`.
 * Intended for use with MSW-mocked tRPC endpoints (e.g., handlers for `/api/trpc`).
 *
 * @param children - React nodes to render inside the providers
 *
 * @example
 * // Wrap component rendering in a test
 * render(
 *   <TRPCTestProvider>
 *     <MyComponent />
 *   </TRPCTestProvider>
 * )
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
 * Produces a wrapper component for testing hooks that provides tRPC and React Query contexts.
 *
 * The returned component renders its children inside a `trpc.Provider` and a `QueryClientProvider`
 * backed by test clients configured for use with mocked /api/trpc endpoints.
 *
 * @returns A React component that accepts `children` and wraps them with tRPC and QueryClient providers.
 *
 * @param children - The React nodes to render inside the providers.
 *
 * @example
 * const wrapper = createTRPCWrapper()
 * renderHook(() => useSomeTrpcHook(), { wrapper })
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