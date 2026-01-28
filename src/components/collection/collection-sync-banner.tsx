// src/components/collection/collection-sync-banner.tsx
import { useIsFetching } from '@tanstack/react-query'
import { Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useCollectionSync } from '@/hooks/use-collection-sync'
import { useUserProfile } from '@/hooks/use-user-profile'

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
  const { t } = useTranslation()
  const { hasChanges, newItemsCount, deletedItemsCount, refreshCollection } =
    useCollectionSync()
  const { profile } = useUserProfile()
  const username = profile?.username

  // Check if collection is currently refetching
  // Use the custom query key from use-collection hook, not tRPC's query key
  const isFetching = useIsFetching({ queryKey: ['collection', username] }) > 0

  if (!hasChanges && !isFetching) return null

  const getMessage = (): string => {
    if (isFetching) return t('collection.refreshing')

    const parts: string[] = []
    if (newItemsCount > 0) {
      parts.push(t('collection.newItems', { count: newItemsCount }))
    }
    if (deletedItemsCount > 0) {
      parts.push(t('collection.deletedItems', { count: deletedItemsCount }))
    }
    parts.push(t('collection.refreshPrompt'))
    return parts.join(' ')
  }

  return (
    <div className="px-6 pt-6">
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
            {isFetching
              ? t('collection.sync.refreshing')
              : t('collection.sync.refreshNow')}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  )
}
