import { createContext } from 'react'

import type { OAuthTokens } from '@/types/discogs'

/**
 * Authentication state managed by AuthProvider.
 *
 * @public
 */
export interface AuthState {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean
  /** Whether auth initialization or validation is in progress */
  isLoading: boolean
  /** Whether the browser is currently online */
  isOnline: boolean
  /** Whether OAuth tokens exist in storage (even if session inactive) */
  hasStoredTokens: boolean
  /** Current OAuth tokens if authenticated, null otherwise */
  oauthTokens: OAuthTokens | null
}

/**
 * Authentication context value providing state and auth methods.
 *
 * @public
 */
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
