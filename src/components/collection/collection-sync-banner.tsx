// src/components/collection/collection-sync-banner.tsx
import { useCollectionSync } from '@/hooks/use-collection-sync'

/**
 * Persistent banner that notifies user of collection changes.
 * Shows until user clicks refresh button.
 *
 * How it works:
 * 1. User adds vinyl on Discogs website
 * 2. User opens VinylDeck → cached collection loads instantly
 * 3. Background metadata check detects count change
 * 4. Banner shows: "5 new items detected"
 * 5. User clicks refresh → full collection refetches
 * 6. Old data shown during refresh (no loading spinner)
 *
 * Note: Currently returns stub implementation - will be enhanced
 * after storage migration is complete.
 */
export function CollectionSyncBanner(): React.JSX.Element | null {
  const { hasChanges } = useCollectionSync()

  if (!hasChanges) return null

  return null // Stub - full implementation will be added later
}
