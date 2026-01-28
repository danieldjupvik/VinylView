import { useEffect, type Dispatch, type SetStateAction } from 'react'

import type { AuthState } from '@/providers/auth-context'

interface CrossTabAuthSyncParams {
  authTokens: { accessToken: string; accessTokenSecret: string } | null
  sessionActive: boolean
  isRestoring: boolean
  state: AuthState
  setState: Dispatch<SetStateAction<AuthState>>
  onCrossTabDisconnect: () => void
}

/**
 * Syncs derived auth state when Zustand store changes from another tab.
 * Handles cross-tab sign out and disconnect scenarios.
 *
 * This effect runs AFTER initialization, reacting to external state changes
 * propagated via Zustand's localStorage sync.
 *
 * @param params - The sync parameters from {@link CrossTabAuthSyncParams}
 * @param params.authTokens - Current OAuth tokens from Zustand store (null if disconnected)
 * @param params.sessionActive - Whether the session is active in Zustand store
 * @param params.isRestoring - Whether IndexedDB cache is still being restored
 * @param params.state - Current AuthState from the provider
 * @param params.setState - State setter for updating AuthState
 * @param params.onCrossTabDisconnect - Callback to clear caches on cross-tab disconnect
 */
export function useCrossTabAuthSync({
  authTokens,
  sessionActive,
  isRestoring,
  state,
  setState,
  onCrossTabDisconnect
}: CrossTabAuthSyncParams): void {
  useEffect(() => {
    // Skip during restoration - initialization effect handles this
    if (isRestoring) {
      return
    }

    // Skip during initial loading - initialization effect handles this
    if (state.isLoading) {
      return
    }

    // Tokens cleared (disconnect from another tab)
    if (!authTokens) {
      setState((prev) => {
        // Only clear caches if we were previously authenticated or had stored tokens
        if (prev.isAuthenticated || prev.hasStoredTokens) {
          onCrossTabDisconnect()
          return {
            ...prev,
            isAuthenticated: false,
            hasStoredTokens: false,
            oauthTokens: null
          }
        }
        return prev
      })
      return
    }

    // Session ended but tokens kept (sign out from another tab)
    if (!sessionActive && state.isAuthenticated) {
      setState((prev) => ({
        ...prev,
        isAuthenticated: false,
        oauthTokens: null
      }))
    }
  }, [
    authTokens,
    sessionActive,
    isRestoring,
    state.isLoading,
    state.isAuthenticated,
    setState,
    onCrossTabDisconnect
  ])
}
