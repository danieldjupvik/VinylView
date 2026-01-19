import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'

import { STORAGE_KEYS } from './constants'

export type ViewMode = 'grid' | 'table'

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN)
}

export function setToken(token: string): void {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token)
}

export function removeToken(): void {
  localStorage.removeItem(STORAGE_KEYS.TOKEN)
}

export function getUsername(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USERNAME)
}

export function setUsername(username: string): void {
  localStorage.setItem(STORAGE_KEYS.USERNAME, username)
}

export function removeUsername(): void {
  localStorage.removeItem(STORAGE_KEYS.USERNAME)
}

export function getAvatarSource(): string | null {
  return localStorage.getItem(STORAGE_KEYS.AVATAR_SOURCE)
}

export function setAvatarSource(source: string): void {
  localStorage.setItem(STORAGE_KEYS.AVATAR_SOURCE, source)
}

export function removeAvatarSource(): void {
  localStorage.removeItem(STORAGE_KEYS.AVATAR_SOURCE)
}

export function getGravatarEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.GRAVATAR_EMAIL)
}

export function setGravatarEmail(email: string): void {
  localStorage.setItem(STORAGE_KEYS.GRAVATAR_EMAIL, email)
}

export function removeGravatarEmail(): void {
  localStorage.removeItem(STORAGE_KEYS.GRAVATAR_EMAIL)
}

export function getStoredIdentity(): DiscogsIdentity | null {
  const raw = localStorage.getItem(STORAGE_KEYS.IDENTITY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as DiscogsIdentity
  } catch {
    localStorage.removeItem(STORAGE_KEYS.IDENTITY)
    return null
  }
}

export function setStoredIdentity(identity: DiscogsIdentity): void {
  localStorage.setItem(STORAGE_KEYS.IDENTITY, JSON.stringify(identity))
}

export function removeStoredIdentity(): void {
  localStorage.removeItem(STORAGE_KEYS.IDENTITY)
}

export function getStoredUserProfile(): DiscogsUserProfile | null {
  const raw = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as DiscogsUserProfile
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
    return null
  }
}

export function setStoredUserProfile(profile: DiscogsUserProfile): void {
  localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
}

export function removeStoredUserProfile(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
}

export function getViewMode(): ViewMode {
  if (typeof window === 'undefined') {
    return 'grid'
  }

  const stored = localStorage.getItem(STORAGE_KEYS.VIEW_MODE)
  return stored === 'table' ? 'table' : 'grid'
}

export function setViewMode(mode: ViewMode): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode)
}

export function clearAuth(): void {
  removeToken()
  removeUsername()
  removeAvatarSource()
  removeGravatarEmail()
  removeStoredIdentity()
  removeStoredUserProfile()
}
