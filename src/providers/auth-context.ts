import { createContext } from 'react'

import type { OAuthTokens } from '@/types/discogs'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  userId: number | null
  avatarUrl: string | null
  /** OAuth tokens for making authenticated API calls via tRPC */
  oauthTokens: OAuthTokens | null
}

export interface AuthContextValue extends AuthState {
  /**
   * Validates OAuth tokens and establishes an authenticated session.
   * Can accept tokens directly (for OAuth callback) or read from storage.
   *
   * @param tokens - Optional tokens to validate. If not provided, reads from storage.
   */
  validateOAuthTokens: (tokens?: OAuthTokens) => Promise<void>
  /**
   * Sign out - ends session but preserves OAuth tokens.
   * User will see "Welcome back" flow on next login.
   */
  signOut: () => void
  /**
   * Disconnect - fully removes Discogs authorization.
   * User will need to re-authorize with Discogs on next login.
   */
  disconnect: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
