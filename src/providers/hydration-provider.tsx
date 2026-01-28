import { useMemo, useState, type ReactNode } from 'react'

import { HydrationContext } from '@/providers/hydration-context'

interface HydrationProviderProps {
  children: ReactNode
}

/**
 * Tracks persisted React Query cache hydration so queries can avoid
 * firing before IndexedDB restoration completes.
 *
 * @param props - Component props
 * @param props.children - The app component tree to wrap with hydration context
 * @returns Provider wrapper with hydration state context
 */
export function HydrationProvider({
  children
}: HydrationProviderProps): React.JSX.Element {
  const [hasHydrated, setHasHydrated] = useState(false)
  const value = useMemo(() => ({ hasHydrated, setHasHydrated }), [hasHydrated])

  return (
    <HydrationContext.Provider value={value}>
      {children}
    </HydrationContext.Provider>
  )
}
