import { createContext } from 'react'

import type { OAuthTokens } from '@/lib/storage'

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
   * Trigger re-validation of OAuth tokens.
   * Called after OAuth callback stores tokens in localStorage.
   */
  validateOAuthTokens: () => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
