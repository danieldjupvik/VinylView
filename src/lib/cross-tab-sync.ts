// src/lib/cross-tab-sync.ts
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useAuthStore } from '@/stores/auth-store'

// Guard against multiple registrations (e.g., during HMR)
let isSetup = false

/**
 * Sets up cross-tab synchronization for auth state.
 * When auth changes in one tab, all other tabs receive the event and sync immediately.
 *
 * Handles:
 * - Sign out: sessionActive becomes false → redirect to login
 * - Disconnect: tokens cleared → redirect to login
 *
 * Security: Prevents logged-out tabs from remaining authenticated.
 *
 * Call this once during app initialization.
 *
 * @returns Cleanup function to remove the event listener
 */
export function setupCrossTabSync(): () => void {
  if (typeof window === 'undefined') return () => {}

  // Prevent duplicate listeners during HMR
  if (isSetup) return () => {}
  isSetup = true

  const handleStorage = (event: StorageEvent): void => {
    // Storage events fire when localStorage changes in OTHER tabs (not same tab)
    if (event.key === STORAGE_KEYS.AUTH) {
      if (event.newValue === null) {
        // Auth was fully cleared (disconnect)
        useAuthStore.getState().disconnect()
      } else {
        // Auth was updated (e.g., sign out where sessionActive changed)
        // Parse the new state and update the store to trigger React re-renders
        try {
          const newState = JSON.parse(event.newValue) as {
            state?: {
              tokens?: unknown
              sessionActive?: boolean
            }
          }
          const store = useAuthStore.getState()

          // Update store with new values from other tab
          if (newState.state) {
            const { tokens, sessionActive } = newState.state

            if (!tokens) {
              // Tokens cleared = disconnect in other tab
              // Call disconnect() to run side effects (reset avatar preferences, etc.)
              // Side effects are idempotent so safe to run in each tab
              store.disconnect()
            } else if (!sessionActive) {
              // Session ended but tokens kept = sign out
              store.signOut()
            }
          }
        } catch (error) {
          // Invalid JSON or unexpected structure - ignore
          console.warn('Failed to parse auth state from storage event:', error)
        }
      }
    }
  }

  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener('storage', handleStorage)
    isSetup = false
  }
}
