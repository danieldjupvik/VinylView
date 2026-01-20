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
  disconnectDiscogs,
  getOAuthTokens,
  getStoredUserProfile,
  isSessionActive,
  setSessionActive,
  setStoredIdentity,
  setStoredUserProfile,
  setUsername,
  signOut as signOutStorage,
  type OAuthTokens
} from '@/lib/storage'
import { trpc } from '@/lib/trpc'

import { AuthContext, type AuthState } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children
}: AuthProviderProps): React.JSX.Element {
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
   * Validates OAuth tokens by fetching identity and profile from the server.
   * This is called on mount (if session active) and after OAuth callback.
   */
  const validateSession = useCallback(
    async (tokens: OAuthTokens): Promise<void> => {
      try {
        // Fetch identity via tRPC client directly with the tokens
        const identityResult =
          await trpcUtils.client.discogs.getIdentity.mutate({
            accessToken: tokens.accessToken,
            accessTokenSecret: tokens.accessTokenSecret
          })

        const { identity } = identityResult

        // Store identity and username
        setStoredIdentity(identity)
        setUsername(identity.username)

        // Fetch user profile for avatar_url and email
        let avatarUrl: string | null = null
        try {
          const profileResult =
            await trpcUtils.client.discogs.getUserProfile.mutate({
              accessToken: tokens.accessToken,
              accessTokenSecret: tokens.accessTokenSecret,
              username: identity.username
            })

          const { profile } = profileResult

          // Store profile in localStorage
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

        // Mark session as active and set authenticated state
        setSessionActive(true)
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
        disconnectDiscogs()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null,
          oauthTokens: null
        })
        // Rethrow so callers can handle the failure (e.g., show error UI, prevent redirect)
        throw error
      }
    },
    [
      trpcUtils.client.discogs.getIdentity,
      trpcUtils.client.discogs.getUserProfile,
      setGravatarEmail
    ]
  )

  // Validate session on mount (only if session was active)
  useEffect(() => {
    const initializeAuth = async () => {
      const tokens = getOAuthTokens()

      if (!tokens) {
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
      if (!isSessionActive()) {
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
      // Catch errors silently on mount - state is already set to unauthenticated by validateSession
      try {
        await validateSession(tokens)
      } catch {
        // Error already handled by validateSession (disconnects and sets state)
      }
    }

    void initializeAuth()
  }, [validateSession])

  /**
   * Validates OAuth tokens and establishes an authenticated session.
   * Can accept tokens directly (for OAuth callback) or read from storage.
   *
   * @param tokens - Optional tokens to validate. If not provided, reads from storage.
   */
  const validateOAuthTokens = useCallback(
    async (tokens?: OAuthTokens): Promise<void> => {
      const tokensToValidate = tokens ?? getOAuthTokens()

      if (!tokensToValidate) {
        throw new Error('No OAuth tokens found')
      }

      setState((prev) => ({ ...prev, isLoading: true }))
      await validateSession(tokensToValidate)
    },
    [validateSession]
  )

  /**
   * Sign out - ends session but preserves OAuth tokens.
   * User will see "Welcome back" flow on next login.
   */
  const signOut = useCallback((): void => {
    signOutStorage()

    setState({
      isAuthenticated: false,
      isLoading: false,
      username: null,
      userId: null,
      avatarUrl: null,
      oauthTokens: null
    })
  }, [])

  /**
   * Disconnect - fully removes Discogs authorization.
   * Clears all tokens and caches. User must re-authorize.
   */
  const disconnect = useCallback((): void => {
    disconnectDiscogs()

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
  }, [])

  const value = useMemo(
    () => ({ ...state, validateOAuthTokens, signOut, disconnect }),
    [state, validateOAuthTokens, signOut, disconnect]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
