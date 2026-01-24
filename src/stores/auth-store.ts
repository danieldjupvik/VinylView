// src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/lib/storage-keys'
import { usePreferencesStore } from '@/stores/preferences-store'

interface AuthTokens {
  accessToken: string
  accessTokenSecret: string
}

/**
 * Cached user profile for "Welcome back" login flow.
 * Stores only the fields needed for the login page UI.
 */
interface CachedUserProfile {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

interface AuthStore {
  // State
  tokens: AuthTokens | null
  sessionActive: boolean
  username: string | null
  userId: number | null
  cachedProfile: CachedUserProfile | null

  // Actions
  setAuth: (tokens: AuthTokens, username: string, userId: number) => void
  setSessionActive: (active: boolean) => void
  setCachedProfile: (profile: CachedUserProfile) => void
  signOut: () => void
  disconnect: () => void
}

/**
 * Zustand store for authentication state.
 * Automatically persists to localStorage (via Zustand) under 'vinyldeck-auth' key.
 *
 * Consolidates:
 * - vinyldeck_oauth_token
 * - vinyldeck_oauth_token_secret
 * - vinyldeck_session_active
 * - vinyldeck_username
 *
 * Two-tier auth system:
 * - signOut(): Ends session, keeps tokens for "welcome back"
 * - disconnect(): Clears everything, requires re-authorization
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      tokens: null,
      sessionActive: false,
      username: null,
      userId: null,
      cachedProfile: null,

      setAuth: (tokens, username, userId) =>
        set({ tokens, username, userId, sessionActive: true }),

      setSessionActive: (active) => set({ sessionActive: active }),

      setCachedProfile: (profile) => set({ cachedProfile: profile }),

      // Sign out: clear session, keep tokens and profile for "welcome back"
      signOut: () => set({ sessionActive: false }),

      // Disconnect: clear everything including user-specific caches
      disconnect: () => {
        // Reset avatar preferences to prevent cross-account data leakage
        usePreferencesStore.getState().resetAvatarSettings()

        set({
          tokens: null,
          sessionActive: false,
          username: null,
          userId: null,
          cachedProfile: null
        })
      }
    }),
    { name: STORAGE_KEYS.AUTH }
  )
)
