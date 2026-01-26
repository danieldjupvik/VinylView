import { useHydrationState } from '@/providers/hydration-context'

/**
 * Gates query execution until the persisted React Query cache hydration completes.
 *
 * Use this for expensive queries whose results are already persisted and should
 * not refetch on hard reloads until hydration completes. Lightweight checks
 * (e.g., metadata polls) can remain ungated if they are safe to run immediately.
 *
 * @param enabled - The normal enabled condition for the query.
 * @returns True when the query may run; false until hydration is complete.
 */
export function useHydrationGuard(enabled: boolean): boolean {
  const { hasHydrated } = useHydrationState()
  return enabled && hasHydrated
}
