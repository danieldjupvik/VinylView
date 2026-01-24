// src/lib/query-persister.ts
import { get, set, del } from 'idb-keyval'

import type {
  PersistedClient,
  Persister
} from '@tanstack/query-persist-client-core'

/**
 * Creates an IndexedDB persister for TanStack Query.
 * Stores the entire query cache in IndexedDB for offline access.
 *
 * Benefits:
 * - No 5MB localStorage limit (critical for large collections)
 * - Async API (non-blocking)
 * - Persists across sessions
 *
 * Error handling: Operations are wrapped in try-catch to prevent
 * cascading failures when IndexedDB is unavailable (private browsing,
 * quota exceeded, or corrupted storage).
 */
const IDB_KEY = 'tanstack-query-cache'

export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    try {
      await set(IDB_KEY, client)
    } catch {
      // Ignore persistence errors - app continues with in-memory cache
    }
  },
  restoreClient: async () => {
    try {
      return await get<PersistedClient>(IDB_KEY)
    } catch {
      // Return undefined if restore fails - starts fresh
      return undefined
    }
  },
  removeClient: async () => {
    try {
      await del(IDB_KEY)
    } catch {
      // Ignore removal errors
    }
  }
}
