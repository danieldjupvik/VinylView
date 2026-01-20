import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'

import { SESSION_STORAGE_KEYS, STORAGE_KEYS } from './constants'

export type ViewMode = 'grid' | 'table'

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

// OAuth token storage (localStorage - persisted)
export interface OAuthTokens {
  accessToken: string
  accessTokenSecret: string
}

export function getOAuthTokens(): OAuthTokens | null {
  const accessToken = localStorage.getItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN)
  const accessTokenSecret = localStorage.getItem(
    STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET
  )

  if (!accessToken || !accessTokenSecret) {
    return null
  }

  return { accessToken, accessTokenSecret }
}

// OAuth 1.0a tokens must be stored client-side for SPA flows. These tokens
// are only useful when combined with the server-side consumer secret for
// request signing. Security relies on XSS prevention (CSP, sanitization).
export function setOAuthTokens(tokens: OAuthTokens): void {
  localStorage.setItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN, tokens.accessToken)
  localStorage.setItem(
    STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET,
    tokens.accessTokenSecret
  )
}

export function removeOAuthTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET)
}

// OAuth request token storage (sessionStorage - temporary)
export interface OAuthRequestTokens {
  requestToken: string
  requestTokenSecret: string
}

export function getOAuthRequestTokens(): OAuthRequestTokens | null {
  const requestToken = sessionStorage.getItem(
    SESSION_STORAGE_KEYS.OAUTH_REQUEST_TOKEN
  )
  const requestTokenSecret = sessionStorage.getItem(
    SESSION_STORAGE_KEYS.OAUTH_REQUEST_SECRET
  )

  if (!requestToken || !requestTokenSecret) {
    return null
  }

  return { requestToken, requestTokenSecret }
}

export function setOAuthRequestTokens(tokens: OAuthRequestTokens): void {
  sessionStorage.setItem(
    SESSION_STORAGE_KEYS.OAUTH_REQUEST_TOKEN,
    tokens.requestToken
  )
  sessionStorage.setItem(
    SESSION_STORAGE_KEYS.OAUTH_REQUEST_SECRET,
    tokens.requestTokenSecret
  )
}

export function clearOAuthRequestTokens(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.OAUTH_REQUEST_TOKEN)
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.OAUTH_REQUEST_SECRET)
}

// Session management
// SESSION_ACTIVE tracks whether user has an active session (vs signed out but tokens preserved)

export function isSessionActive(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE) === 'true'
}

export function setSessionActive(active: boolean): void {
  if (active) {
    localStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true')
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE)
  }
}

/**
 * Sign out - ends session but preserves OAuth tokens for quick re-login.
 * User will see "Welcome back" on next visit.
 */
export function signOut(): void {
  setSessionActive(false)
  // Keep OAuth tokens and username for "Welcome back" flow
  // Only clear session-specific data
  removeStoredIdentity()
  removeStoredUserProfile()
  removeAvatarSource()
  removeGravatarEmail()
}

/**
 * Disconnect Discogs - fully removes authorization.
 * User will need to re-authorize with Discogs on next login.
 */
export function disconnectDiscogs(): void {
  setSessionActive(false)
  removeUsername()
  removeAvatarSource()
  removeGravatarEmail()
  removeStoredIdentity()
  removeStoredUserProfile()
  removeOAuthTokens()
}

/**
 * @deprecated Use signOut() or disconnectDiscogs() instead.
 * Kept for backwards compatibility during migration.
 */
export function clearAuth(): void {
  disconnectDiscogs()
}
