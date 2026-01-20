import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { usePreferences } from '@/hooks/use-preferences'
import {
  clearAuth,
  getOAuthTokens,
  getStoredUserProfile,
  setStoredIdentity,
  setUsername,
  type OAuthTokens
} from '@/lib/storage'
import { trpc } from '@/lib/trpc'

import { AuthContext, type AuthState } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { gravatarEmail, setGravatarEmail } = usePreferences()
  const latestGravatarEmailRef = useRef(gravatarEmail)
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userId: null,
    avatarUrl: null,
    oauthTokens: null
  })

  // Get tRPC utils for direct client access
  const trpcUtils = trpc.useUtils()

  useEffect(() => {
    latestGravatarEmailRef.current = gravatarEmail
  }, [gravatarEmail])

  /**
   * Validates OAuth tokens by fetching identity from the server.
   * This is called on mount and after OAuth callback.
   */
  const validateSession = useCallback(
    async (tokens: OAuthTokens) => {
      try {
        // Fetch identity via tRPC client directly with the tokens
        // This avoids the useQuery stale input issue
        const result = await trpcUtils.client.discogs.getIdentity.query({
          accessToken: tokens.accessToken,
          accessTokenSecret: tokens.accessTokenSecret
        })

        const { identity } = result

        // Store identity and username
        setStoredIdentity(identity)
        setUsername(identity.username)

        // Try to get cached profile for avatar
        const profile = getStoredUserProfile()

        // Update gravatar email from profile if not already set
        if (!latestGravatarEmailRef.current && profile?.email) {
          latestGravatarEmailRef.current = profile.email
          setGravatarEmail(profile.email)
        }

        // Set authenticated state
        // Note: /oauth/identity doesn't return avatar_url, only user profile does
        setState({
          isAuthenticated: true,
          isLoading: false,
          username: identity.username,
          userId: identity.id,
          avatarUrl: profile?.avatar_url ?? null,
          oauthTokens: tokens
        })
      } catch {
        // Tokens are invalid or expired
        clearAuth()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null,
          oauthTokens: null
        })
      }
    },
    [trpcUtils.client.discogs.getIdentity, setGravatarEmail]
  )

  // Validate session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = getOAuthTokens()

      if (!tokens) {
        // No OAuth tokens, user is not authenticated
        clearAuth()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null,
          oauthTokens: null
        })
        return
      }

      // Validate tokens
      await validateSession(tokens)
    }

    void initializeAuth()
  }, [validateSession])

  /**
   * Re-validate OAuth tokens.
   * Called after OAuth callback stores new tokens in localStorage.
   */
  const validateOAuthTokens = useCallback(async () => {
    const tokens = getOAuthTokens()

    if (!tokens) {
      throw new Error('No OAuth tokens found')
    }

    setState((prev) => ({ ...prev, isLoading: true }))
    await validateSession(tokens)
  }, [validateSession])

  const logout = useCallback(() => {
    clearAuth()

    // Clear sensitive caches on logout
    if ('caches' in window) {
      const cacheNames = [
        'discogs-api-cache',
        'discogs-images-cache',
        'gravatar-images-cache'
      ]
      cacheNames.forEach((name) => {
        caches.delete(name).catch(() => {
          // Ignore errors if cache doesn't exist
        })
      })
    }

    setState({
      isAuthenticated: false,
      isLoading: false,
      username: null,
      userId: null,
      avatarUrl: null,
      oauthTokens: null
    })
  }, [])

  const value = useMemo(
    () => ({ ...state, validateOAuthTokens, logout }),
    [state, validateOAuthTokens, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
