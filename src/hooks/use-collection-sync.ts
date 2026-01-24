// src/hooks/use-collection-sync.ts
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth-store'
import type { DiscogsCollectionResponse } from '@/types/discogs'

/**
 * Detects changes in user's Discogs collection by comparing
 * cached data with live metadata.
 *
 * Runs fast metadata check (1 API call) on window focus to detect
 * new/deleted items without refetching expensive full collection.
 *
 * @returns Change detection state and counts
 */
export function useCollectionSync(): {
  hasChanges: boolean
  newItemsCount: number
  deletedItemsCount: number
  refreshCollection: () => void
} {
  const queryClient = useQueryClient()
  const tokens = useAuthStore((state) => state.tokens)
  const username = useAuthStore((state) => state.username)

  // Fast metadata check (auto-refetches on window focus)
  const { data: meta } = trpc.discogs.getCollectionMetadata.useQuery(
    tokens && username
      ? {
          accessToken: tokens.accessToken,
          accessTokenSecret: tokens.accessTokenSecret,
          username
        }
      : { accessToken: '', accessTokenSecret: '', username: '' },
    {
      enabled: Boolean(tokens && username),
      refetchOnWindowFocus: true,
      refetchInterval: 60 * 1000,
      staleTime: 10 * 1000 // 10 seconds - responsive tab-switch detection (metadata check is cheap)
    }
  )

  // Critical: Must match on stable prefix ['collection', username] not ['collection', username, 'all']
  // because the query key varies based on filters (page number vs 'all'). The subscription ensures
  // reactivity when cache updates. Changing this can miss cached data or cause stale comparisons.
  const cachedCount = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => {
      if (!username) return 0

      const queries = queryClient.getQueryCache().findAll({
        queryKey: ['collection', username],
        exact: false,
        predicate: (query) => query.state.data !== undefined
      })

      let latestQuery: (typeof queries)[number] | undefined
      for (const query of queries) {
        if (
          !latestQuery ||
          query.state.dataUpdatedAt > latestQuery.state.dataUpdatedAt
        ) {
          latestQuery = query
        }
      }

      const cachedCollection = latestQuery?.state.data as
        | DiscogsCollectionResponse
        | undefined
      return cachedCollection?.pagination?.items ?? 0
    },
    () => 0
  )

  // Calculate changes
  const liveCount = meta?.totalCount ?? 0

  const hasChanges = cachedCount > 0 && liveCount !== cachedCount
  const newItemsCount = Math.max(0, liveCount - cachedCount)
  const deletedItemsCount = Math.max(0, cachedCount - liveCount)

  return {
    hasChanges,
    newItemsCount,
    deletedItemsCount,
    refreshCollection: () => {
      // Invalidate and refetch all collection queries, including inactive ones
      // (e.g., when user clicks refresh from Settings page)
      void queryClient.invalidateQueries({
        queryKey: ['collection', username],
        refetchType: 'all'
      })
    }
  }
}
