// src/lib/oauth-session.ts
// Temporary OAuth session helpers (sessionStorage only)
// Access tokens are now managed by Zustand auth-store
import { SESSION_KEYS } from '@/lib/storage-keys'
import type { OAuthRequestTokens } from '@/types/discogs'

export function getOAuthRequestTokens(): OAuthRequestTokens | null {
  const requestToken = sessionStorage.getItem(SESSION_KEYS.OAUTH_REQUEST)
  const requestTokenSecret = sessionStorage.getItem(
    `${SESSION_KEYS.OAUTH_REQUEST}_secret`
  )

  if (!requestToken || !requestTokenSecret) {
    return null
  }

  return { requestToken, requestTokenSecret }
}

export function setOAuthRequestTokens(tokens: OAuthRequestTokens): void {
  sessionStorage.setItem(SESSION_KEYS.OAUTH_REQUEST, tokens.requestToken)
  sessionStorage.setItem(
    `${SESSION_KEYS.OAUTH_REQUEST}_secret`,
    tokens.requestTokenSecret
  )
}

export function clearOAuthRequestTokens(): void {
  sessionStorage.removeItem(SESSION_KEYS.OAUTH_REQUEST)
  sessionStorage.removeItem(`${SESSION_KEYS.OAUTH_REQUEST}_secret`)
}
