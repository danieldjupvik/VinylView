import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { usePreferences } from '@/hooks/use-preferences'
import { trpc } from '@/lib/trpc'
import {
  getStoredUserProfile,
  setStoredUserProfile
} from '@/lib/user-profile-cache'
import { useAuthStore } from '@/stores/auth-store'

import { AuthContext, type AuthState } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children
}: AuthProviderProps): React.JSX.Element {
  const { gravatarEmail, setGravatarEmail } = usePreferences()
  const latestGravatarEmailRef = useRef(gravatarEmail)

  // Subscribe to Zustand auth store
  const authTokens = useAuthStore((state) => state.tokens)
  const sessionActive = useAuthStore((state) => state.sessionActive)
  const setAuth = useAuthStore((state) => state.setAuth)
  const signOutStore = useAuthStore((state) => state.signOut)
  const disconnectStore = useAuthStore((state) => state.disconnect)

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
   * Validates OAuth tokens by fetching identity and profile from the server.
   * This is called on mount (if session active) and after OAuth callback.
   */
  const validateSession = useCallback(
    async (tokens: {
      accessToken: string
      accessTokenSecret: string
    }): Promise<void> => {
      try {
        // Fetch identity via tRPC client directly with the tokens
        const identityResult = await trpcUtils.client.discogs.getIdentity.query(
          {
            accessToken: tokens.accessToken,
            accessTokenSecret: tokens.accessTokenSecret
          }
        )

        const { identity } = identityResult

        // Fetch user profile for avatar_url and email
        let avatarUrl: string | null = null
        try {
          const profileResult =
            await trpcUtils.client.discogs.getUserProfile.query({
              accessToken: tokens.accessToken,
              accessTokenSecret: tokens.accessTokenSecret,
              username: identity.username
            })

          const { profile } = profileResult

          // Store profile in localStorage (will be moved to TanStack Query cache later)
          setStoredUserProfile({
            id: profile.id,
            username: profile.username,
            resource_url: identity.resource_url,
            avatar_url: profile.avatar_url,
            num_collection: profile.num_collection,
            num_wantlist: profile.num_wantlist,
            ...(profile.email && { email: profile.email })
          })

          avatarUrl = profile.avatar_url ?? null

          // Update gravatar email from profile if not already set
          if (!latestGravatarEmailRef.current && profile.email) {
            latestGravatarEmailRef.current = profile.email
            setGravatarEmail(profile.email)
          }
        } catch {
          // Profile fetch failed, try to use cached profile
          const cachedProfile = getStoredUserProfile()
          avatarUrl = cachedProfile?.avatar_url ?? null
          if (!latestGravatarEmailRef.current && cachedProfile?.email) {
            latestGravatarEmailRef.current = cachedProfile.email
            setGravatarEmail(cachedProfile.email)
          }
        }

        // Update Zustand store and component state
        setAuth(tokens, identity.username, identity.id)
        setState({
          isAuthenticated: true,
          isLoading: false,
          username: identity.username,
          userId: identity.id,
          avatarUrl,
          oauthTokens: tokens
        })
      } catch (error) {
        // Tokens are invalid or expired - fully disconnect
        disconnectStore()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null,
          oauthTokens: null
        })
        throw error
      }
    },
    [
      trpcUtils.client.discogs.getIdentity,
      trpcUtils.client.discogs.getUserProfile,
      setGravatarEmail,
      setAuth,
      disconnectStore
    ]
  )

  // Validate session on mount (only if session was active)
  useEffect(() => {
    const initializeAuth = async () => {
      if (!authTokens) {
        // No OAuth tokens, user is not authenticated
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

      // Only auto-login if session was active (user didn't sign out)
      if (!sessionActive) {
        // Tokens exist but user signed out - show "Welcome back" flow
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

      // Session was active, validate tokens
      try {
        await validateSession(authTokens)
      } catch {
        // Error already handled by validateSession
      }
    }

    void initializeAuth()
  }, [authTokens, sessionActive, validateSession])

  /**
   * Validates OAuth tokens and establishes an authenticated session.
   * Can accept tokens directly (for OAuth callback) or read from storage.
   */
  const validateOAuthTokens = useCallback(
    async (tokens?: {
      accessToken: string
      accessTokenSecret: string
    }): Promise<void> => {
      const tokensToValidate = tokens ?? authTokens

      if (!tokensToValidate) {
        throw new Error('No OAuth tokens found')
      }

      setState((prev) => ({ ...prev, isLoading: true }))
      await validateSession(tokensToValidate)
    },
    [authTokens, validateSession]
  )

  /**
   * Sign out - ends session but preserves OAuth tokens.
   * User will see "Welcome back" flow on next login.
   */
  const signOut = useCallback((): void => {
    signOutStore()

    setState({
      isAuthenticated: false,
      isLoading: false,
      username: null,
      userId: null,
      avatarUrl: null,
      oauthTokens: null
    })
  }, [signOutStore])

  /**
   * Disconnect - fully removes Discogs authorization.
   * Clears all tokens and caches. User must re-authorize.
   */
  const disconnect = useCallback((): void => {
    disconnectStore()

    // Clear sensitive caches on disconnect
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
  }, [disconnectStore])

  const value = useMemo(
    () => ({ ...state, validateOAuthTokens, signOut, disconnect }),
    [state, validateOAuthTokens, signOut, disconnect]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
