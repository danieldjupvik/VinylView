// src/hooks/use-collection-sync.ts
import { useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'

import { useUserProfile } from '@/hooks/use-user-profile'
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
  const { profile } = useUserProfile()
  const username = profile?.username

  // Fast metadata check (auto-refetches on window focus)
  const { data: meta, isSuccess: isMetaSuccess } =
    trpc.discogs.getCollectionMetadata.useQuery(
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
        staleTime: 30 * 1000 // 30 sec debounce for tab-switch detection
      }
    )

  // Critical: Must match on stable prefix ['collection', username] not ['collection', username, 'all']
  // because the query key varies based on filters (page number vs 'all'). The subscription ensures
  // reactivity when cache updates. Changing this can miss cached data or cause stale comparisons.
  const cachedState = useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => {
      if (!username) return '0|0'

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
      const cachedCount = cachedCollection?.pagination.items ?? 0
      const hasCachedData = cachedCollection !== undefined
      return `${hasCachedData ? 1 : 0}|${cachedCount}`
    },
    () => '0|0'
  )

  const [hasCachedDataToken, cachedCountToken] = cachedState.split('|')
  const hasCachedData = hasCachedDataToken === '1'
  const cachedCount = Number(cachedCountToken)

  const hasLiveCount = isMetaSuccess && typeof meta.totalCount === 'number'
  const liveCount = hasLiveCount ? meta.totalCount : cachedCount

  const hasChanges = hasCachedData && hasLiveCount && liveCount !== cachedCount
  const newItemsCount =
    hasCachedData && hasLiveCount ? Math.max(0, liveCount - cachedCount) : 0
  const deletedItemsCount =
    hasCachedData && hasLiveCount ? Math.max(0, cachedCount - liveCount) : 0

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
