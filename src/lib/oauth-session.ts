// src/lib/oauth-session.ts
/**
 * Temporary OAuth session helpers (sessionStorage only).
 * Access tokens are managed by Zustand auth-store.
 *
 * sessionStorage is appropriate for these temporary tokens because:
 * - They're short-lived (only during OAuth flow)
 * - Automatically cleared on tab close
 * - Isolated per tab (prevents cross-tab interference during OAuth)
 */
import { SESSION_KEYS } from '@/lib/storage-keys'
import type { OAuthRequestTokens } from '@/types/discogs'

export function getOAuthRequestTokens(): OAuthRequestTokens | null {
  try {
    const requestToken = sessionStorage.getItem(SESSION_KEYS.OAUTH_REQUEST)
    const requestTokenSecret = sessionStorage.getItem(
      SESSION_KEYS.OAUTH_REQUEST_SECRET
    )

    if (!requestToken || !requestTokenSecret) {
      return null
    }

    return { requestToken, requestTokenSecret }
  } catch {
    // sessionStorage may throw in private browsing mode
    return null
  }
}

export function setOAuthRequestTokens(tokens: OAuthRequestTokens): void {
  try {
    sessionStorage.setItem(SESSION_KEYS.OAUTH_REQUEST, tokens.requestToken)
    sessionStorage.setItem(
      SESSION_KEYS.OAUTH_REQUEST_SECRET,
      tokens.requestTokenSecret
    )
  } catch {
    // Ignore storage errors (private browsing, quota exceeded)
  }
}

export function clearOAuthRequestTokens(): void {
  try {
    sessionStorage.removeItem(SESSION_KEYS.OAUTH_REQUEST)
    sessionStorage.removeItem(SESSION_KEYS.OAUTH_REQUEST_SECRET)
  } catch {
    // Ignore storage errors
  }
}
