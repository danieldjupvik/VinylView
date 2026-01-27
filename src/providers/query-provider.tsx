import { QueryClient, keepPreviousData } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { useState, type ReactNode } from 'react'

import { isNonRetryableError } from '@/lib/errors'
import { queryPersister } from '@/lib/query-persister'
import { createTRPCClient, trpc } from '@/lib/trpc'
import { useHydrationState } from '@/providers/hydration-context'
import { HydrationProvider } from '@/providers/hydration-provider'

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        placeholderData: keepPreviousData, // Show old data during refetch
        retry: (failureCount, error) => {
          // Don't retry on errors where retrying won't help
          if (isNonRetryableError(error)) {
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

/** Persistence options for IndexedDB cache restoration */
const persistOptions = {
  persister: queryPersister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: {
      queryKey: readonly unknown[]
      state: { data: unknown; status: string }
    }) => {
      // Don't persist queries with no data (empty shells after cache clear)
      if (query.state.status !== 'success' || query.state.data === undefined) {
        return false
      }

      // Exclude getCollectionMetadata - lightweight poll that runs fresh anyway
      const key = query.queryKey[0]
      if (Array.isArray(key) && key[1] === 'getCollectionMetadata') {
        return false
      }
      return true
    }
  }
}

function QueryProviderInner({
  children
}: QueryProviderProps): React.JSX.Element {
  const [queryClient] = useState(createQueryClient)
  const [trpcClient] = useState(createTRPCClient)
  const { setHasHydrated } = useHydrationState()

  /**
   * Marks hydration as complete for both success and failure so
   * expensive queries can still run when persistence is unavailable.
   */
  const markHydrated = () => {
    setHasHydrated(true)
  }

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={persistOptions}
        onSuccess={markHydrated}
        onError={markHydrated}
      >
        {children}
      </PersistQueryClientProvider>
    </trpc.Provider>
  )
}

export function QueryProvider({
  children
}: QueryProviderProps): React.JSX.Element {
  return (
    <HydrationProvider>
      <QueryProviderInner>{children}</QueryProviderInner>
    </HydrationProvider>
  )
}
