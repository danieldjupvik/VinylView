import { useEffect, useState, type ReactNode } from 'react'
import {
  getAvatarSource,
  getGravatarEmail,
  setAvatarSource as storeAvatarSource,
  setGravatarEmail as storeGravatarEmail
} from '@/lib/storage'
import { buildGravatarUrl, normalizeGravatarEmail } from '@/lib/gravatar'
import { PreferencesContext, type AvatarSource } from './preferences-context'

interface PreferencesProviderProps {
  children: ReactNode
}

const DEFAULT_AVATAR_SOURCE: AvatarSource = 'discogs'

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const [avatarSource, setAvatarSourceState] = useState<AvatarSource>(() => {
    const stored = getAvatarSource()
    return stored === 'gravatar' ? 'gravatar' : DEFAULT_AVATAR_SOURCE
  })
  const [gravatarEmail, setGravatarEmailState] = useState(
    () => getGravatarEmail() ?? ''
  )
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = buildGravatarUrl(gravatarEmail, 128)
    if (!url) {
      return
    }

    let isActive = true
    const image = new Image()
    image.onload = () => {
      if (isActive) {
        setGravatarUrl(url)
      }
    }
    image.onerror = () => {
      if (isActive) {
        setGravatarUrl(null)
      }
    }
    image.src = url

    return () => {
      isActive = false
    }
  }, [gravatarEmail])

  const setAvatarSource = (source: AvatarSource) => {
    storeAvatarSource(source)
    setAvatarSourceState(source)
  }

  const setGravatarEmail = (email: string) => {
    const normalized = normalizeGravatarEmail(email)
    storeGravatarEmail(normalized)
    setGravatarEmailState(normalized)
    setGravatarUrl(null)
  }

  return (
    <PreferencesContext.Provider
      value={{
        avatarSource,
        gravatarEmail,
        gravatarUrl,
        setAvatarSource,
        setGravatarEmail
      }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}
