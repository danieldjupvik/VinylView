// src/lib/query-persister.ts
import { experimental_createQueryPersister } from '@tanstack/query-persist-client-core'
import { get, set, del } from 'idb-keyval'

/**
 * Creates an IndexedDB persister for TanStack Query.
 * Uses per-query persistence for memory efficiency.
 *
 * Benefits:
 * - No 5MB localStorage limit (critical for aggregated collections)
 * - Async API (non-blocking)
 * - 30-day cache lifetime for expensive API calls
 */
export const queryPersister = experimental_createQueryPersister({
  storage: {
    getItem: async (key: string) => await get(key),
    setItem: async (key: string, value: unknown) => await set(key, value),
    removeItem: async (key: string) => await del(key)
  },
  maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
})
