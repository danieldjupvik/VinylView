import { createContext } from 'react'

export type AvatarSource = 'discogs' | 'gravatar'

export interface PreferencesContextValue {
  avatarSource: AvatarSource
  gravatarEmail: string
  gravatarUrl: string | null
  setAvatarSource: (source: AvatarSource) => void
  setGravatarEmail: (email: string) => void
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(
  null
)
