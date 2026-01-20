import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'

import { SESSION_STORAGE_KEYS, STORAGE_KEYS } from './constants'

export type ViewMode = 'grid' | 'table'

/**
 * Retrieve the stored Discogs username from localStorage.
 *
 * @returns The username string if present, otherwise `null`.
 */
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

/**
 * Persist the user's preferred view mode.
 *
 * Stores the provided view mode so it can be restored on subsequent visits; no-op outside a browser environment.
 *
 * @param mode - The desired view mode, either `'grid'` or `'table'`
 */
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

/**
 * Retrieve the stored OAuth access token and its secret.
 *
 * @returns An object with `accessToken` and `accessTokenSecret`, or `null` if either value is missing.
 */
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
/**
 * Store the OAuth access token and its secret in localStorage.
 *
 * @param tokens - An object containing `accessToken` and `accessTokenSecret` to be persisted for authenticated requests.
 *
 * @example
 * setOAuthTokens({ accessToken: 'abc', accessTokenSecret: 'def' })
 */
export function setOAuthTokens(tokens: OAuthTokens): void {
  localStorage.setItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN, tokens.accessToken)
  localStorage.setItem(
    STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET,
    tokens.accessTokenSecret
  )
}

/**
 * Remove the stored OAuth access token and access token secret from localStorage.
 *
 * This clears both STORAGE_KEYS.OAUTH_ACCESS_TOKEN and STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET so no OAuth credentials remain in localStorage.
 */
export function removeOAuthTokens(): void {
  localStorage.removeItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN)
  localStorage.removeItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET)
}

// OAuth request token storage (sessionStorage - temporary)
export interface OAuthRequestTokens {
  requestToken: string
  requestTokenSecret: string
}

/**
 * Retrieves temporary OAuth request tokens stored in sessionStorage.
 *
 * @returns An object containing `requestToken` and `requestTokenSecret`, or `null` if either value is missing.
 *
 * @example
 * const tokens = getOAuthRequestTokens()
 * if (tokens) {
 *   // use tokens.requestToken and tokens.requestTokenSecret
 * }
 */
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

/**
 * Stores the OAuth request token and request token secret in sessionStorage.
 *
 * @param tokens - Object containing the `requestToken` and `requestTokenSecret` to store
 *
 * @example
 * setOAuthRequestTokens({ requestToken: 'abc', requestTokenSecret: 'def' })
 */
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

/**
 * Remove the temporary OAuth request token and secret from sessionStorage.
 *
 * Clears the session-stored credentials used during the OAuth handshake by removing
 * SESSION_STORAGE_KEYS.OAUTH_REQUEST_TOKEN and SESSION_STORAGE_KEYS.OAUTH_REQUEST_SECRET.
 */
export function clearOAuthRequestTokens(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.OAUTH_REQUEST_TOKEN)
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.OAUTH_REQUEST_SECRET)
}

// Session management
/**
 * Checks whether a persistent session flag is set in localStorage.
 *
 * @returns `true` if the stored session flag equals `'true'`, `false` otherwise.
 */

export function isSessionActive(): boolean {
  return localStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE) === 'true'
}

/**
 * Sets whether the session is active.
 *
 * @param active - `true` to mark the session as active, `false` to mark it as inactive
 */
export function setSessionActive(active: boolean): void {
  if (active) {
    localStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true')
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE)
  }
}

/**
 * End the current session while preserving OAuth tokens and username for a quick re-login flow.
 *
 * Clears stored identity, user profile, avatar source, and gravatar email, and marks the session as inactive.
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
 * Remove all locally stored Discogs authorization and user data so the user must re-authorize on next login.
 *
 * This clears the persistent session flag, username, avatar source, gravatar email, stored identity, stored user
 * profile, and OAuth tokens from web storage.
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