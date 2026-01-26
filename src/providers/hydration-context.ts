import { createContext, useContext } from 'react'

interface HydrationState {
  hasHydrated: boolean
  setHasHydrated: (value: boolean) => void
}

const HydrationContext = createContext<HydrationState | undefined>(undefined)

/**
 * Reads hydration state for gating query execution.
 *
 * @returns Hydration state and setter for persistence callbacks.
 */
export function useHydrationState(): HydrationState {
  const context = useContext(HydrationContext)
  if (!context) {
    throw new Error('useHydrationState must be used within HydrationProvider')
  }
  return context
}

export { HydrationContext }
