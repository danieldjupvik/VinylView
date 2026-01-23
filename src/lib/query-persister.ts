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
 */
const IDB_KEY = 'tanstack-query-cache'

export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, client)
  },
  restoreClient: async () => {
    return await get<PersistedClient>(IDB_KEY)
  },
  removeClient: async () => {
    await del(IDB_KEY)
  }
}
