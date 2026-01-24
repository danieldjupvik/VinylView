// src/stores/preferences-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'grid' | 'table'
type AvatarSource = 'discogs' | 'gravatar'

interface PreferencesStore {
  // State
  viewMode: ViewMode
  avatarSource: AvatarSource
  gravatarEmail: string

  // Actions
  setViewMode: (mode: ViewMode) => void
  setAvatarSource: (source: AvatarSource) => void
  setGravatarEmail: (email: string) => void
  resetAvatarSettings: () => void
}

/**
 * Zustand store for user preferences.
 * Automatically persists to localStorage under 'vinyldeck-prefs' key.
 *
 * Consolidates:
 * - vinyldeck_view_mode
 * - vinyldeck_avatar_source
 * - vinyldeck_gravatar_email
 */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      avatarSource: 'discogs',
      gravatarEmail: '',

      setViewMode: (mode) => set({ viewMode: mode }),
      setAvatarSource: (source) => set({ avatarSource: source }),
      setGravatarEmail: (email) => set({ gravatarEmail: email }),
      resetAvatarSettings: () =>
        set({ avatarSource: 'discogs', gravatarEmail: '' })
    }),
    { name: 'vinyldeck-prefs' }
  )
)
