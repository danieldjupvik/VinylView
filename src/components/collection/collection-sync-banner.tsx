// src/components/collection/collection-sync-banner.tsx
import { useIsFetching } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCollectionSync } from '@/hooks/use-collection-sync'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Global persistent banner that notifies user of collection changes.
 * Appears on all authenticated pages and persists until user clicks refresh.
 *
 * How it works:
 * 1. User adds vinyl on Discogs website
 * 2. User opens VinylDeck → cached collection loads instantly
 * 3. Background metadata check detects count change (refetch on window focus)
 * 4. Banner shows: "5 new items detected. Refresh to see changes."
 * 5. User clicks refresh → full collection refetches
 * 6. Old data shown during refresh (no loading spinner on collection view)
 * 7. Banner visible on Settings, Collection, and all future authenticated pages
 */
export function CollectionSyncBanner(): React.JSX.Element | null {
  const { hasChanges, newItemsCount, deletedItemsCount, refreshCollection } =
    useCollectionSync()
  const username = useAuthStore((state) => state.username)

  // Check if collection is currently refetching
  // Use the custom query key from use-collection hook, not tRPC's query key
  const isFetching = useIsFetching({ queryKey: ['collection', username] }) > 0

  if (!hasChanges && !isFetching) return null

  const getMessage = (): string => {
    if (isFetching) return 'Refreshing collection...'

    const parts: string[] = []
    if (newItemsCount > 0) {
      parts.push(
        `${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} detected.`
      )
    }
    if (deletedItemsCount > 0) {
      parts.push(
        `${deletedItemsCount} item${deletedItemsCount > 1 ? 's' : ''} removed.`
      )
    }
    parts.push('Refresh to see changes.')
    return parts.join(' ')
  }

  return (
    <Alert className="mb-4">
      {isFetching ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <span>{getMessage()}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCollection}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
