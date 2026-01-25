import { createContext } from 'react'

import type { OAuthTokens } from '@/types/discogs'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  isOnline: boolean
  hasStoredTokens: boolean
  oauthTokens: OAuthTokens | null
}

export interface AuthContextValue extends AuthState {
  /**
   * Validates OAuth tokens only (does not fetch profile).
   * Use for page load validation when online.
   *
   * @param tokens - Optional tokens to validate. If not provided, reads from storage.
   */
  validateOAuthTokens: (tokens?: OAuthTokens) => Promise<void>
  /**
   * Establishes a full session: validates tokens and fetches profile.
   * Use for login, "Continue" click, and reconnect scenarios.
   *
   * @param tokens - Optional tokens to use. If not provided, reads from storage.
   */
  establishSession: (tokens?: OAuthTokens) => Promise<void>
  /**
   * Sign out - ends session but preserves OAuth tokens.
   * User will see "Welcome back" flow on next login.
   */
  signOut: () => void
  /**
   * Disconnect - fully removes Discogs authorization.
   * Clears all tokens, profile cache, and IndexedDB data.
   * User will need to re-authorize with Discogs on next login.
   */
  disconnect: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
