import { useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePreferences } from '@/hooks/use-preferences'
import { type UserProfile, useUserProfile } from '@/hooks/use-user-profile'
import { queryPersister } from '@/lib/query-persister'
import { trpc } from '@/lib/trpc'
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
  const setTokens = useAuthStore((state) => state.setTokens)
  const setSessionActive = useAuthStore((state) => state.setSessionActive)
  const signOutStore = useAuthStore((state) => state.signOut)
  const disconnectStore = useAuthStore((state) => state.disconnect)

  // Online status
  const isOnline = useOnlineStatus()

  // User profile from TanStack Query
  const { fetchProfile, clearProfile } = useUserProfile()

  // Query client for cache management
  const queryClient = useQueryClient()

  // Track previous tokens to detect changes (for cross-account leakage prevention)
  const prevTokensRef = useRef(authTokens)

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    isOnline: true,
    hasStoredTokens: false,
    oauthTokens: null
  })

  // Get tRPC utils for direct client access
  const trpcUtils = trpc.useUtils()

  useEffect(() => {
    latestGravatarEmailRef.current = gravatarEmail
  }, [gravatarEmail])

  // Update online status in state
  useEffect(() => {
    setState((prev) => ({ ...prev, isOnline }))
  }, [isOnline])

  // Update hasStoredTokens in state
  useEffect(() => {
    setState((prev) => ({ ...prev, hasStoredTokens: authTokens !== null }))
  }, [authTokens])

  // Clear stale profile if tokens change without disconnect (prevents cross-account leakage)
  useEffect(() => {
    if (
      prevTokensRef.current &&
      authTokens &&
      (prevTokensRef.current.accessToken !== authTokens.accessToken ||
        prevTokensRef.current.accessTokenSecret !==
          authTokens.accessTokenSecret)
    ) {
      // Tokens changed without disconnect - clear stale profile
      queryClient.removeQueries({ queryKey: ['userProfile'] })
    }
    prevTokensRef.current = authTokens
  }, [authTokens, queryClient])

  /**
   * Validates OAuth tokens by fetching identity from the server.
   * Does NOT fetch profile - use establishSession for that.
   */
  const validateTokens = useCallback(
    async (tokens: {
      accessToken: string
      accessTokenSecret: string
    }): Promise<{ username: string; id: number }> => {
      const identityResult = await trpcUtils.client.discogs.getIdentity.query({
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret
      })

      return identityResult.identity
    },
    [trpcUtils.client.discogs.getIdentity]
  )

  /**
   * Validates OAuth tokens without fetching profile.
   * Called on page load when online to verify tokens are still valid.
   * If profile cache is missing after validation, fetches it.
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

      try {
        const identity = await validateTokens(tokensToValidate)

        // Check if profile is cached - if not, fetch it
        const cachedProfile = queryClient.getQueryData<UserProfile>([
          'userProfile'
        ])
        if (!cachedProfile) {
          // Profile missing - fetch it now to avoid broken state
          // Pass tokens directly to avoid store timing issues
          const userProfile = await fetchProfile(
            identity.username,
            tokensToValidate
          )

          // Update gravatar email from profile if not already set
          if (!latestGravatarEmailRef.current && userProfile.email) {
            latestGravatarEmailRef.current = userProfile.email
            setGravatarEmail(userProfile.email)
          }
        }

        // Store tokens if new ones were provided
        if (tokens) {
          setTokens(tokens)
        }

        setSessionActive(true)
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          oauthTokens: tokensToValidate
        }))
      } catch (error) {
        // Tokens are invalid or expired - fully disconnect
        disconnectStore()
        clearProfile()

        setState({
          isAuthenticated: false,
          isLoading: false,
          isOnline,
          hasStoredTokens: false,
          oauthTokens: null
        })
        throw error
      }
    },
    [
      authTokens,
      validateTokens,
      queryClient,
      fetchProfile,
      setGravatarEmail,
      setTokens,
      setSessionActive,
      disconnectStore,
      clearProfile,
      isOnline
    ]
  )

  /**
   * Establishes a full session: validates tokens and fetches profile.
   * Called on login, "Continue" click, and reconnect.
   *
   * OFFLINE BEHAVIOR: If offline and cached profile exists, trusts cached
   * state without network validation. If offline with no cached profile,
   * throws an error (caller should handle this gracefully).
   */
  const establishSession = useCallback(
    async (tokens?: {
      accessToken: string
      accessTokenSecret: string
    }): Promise<void> => {
      const tokensToUse = tokens ?? authTokens

      if (!tokensToUse) {
        throw new Error('No OAuth tokens found')
      }

      setState((prev) => ({ ...prev, isLoading: true }))

      // OFFLINE PATH: trust cached state if available
      if (!isOnline) {
        const cachedProfile = queryClient.getQueryData<UserProfile>([
          'userProfile'
        ])
        if (!cachedProfile) {
          setState((prev) => ({ ...prev, isLoading: false }))
          throw new Error('Cannot continue offline without cached profile')
        }

        // Trust cached profile and tokens
        setSessionActive(true)
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          oauthTokens: tokensToUse
        }))
        return
      }

      // ONLINE PATH: validate tokens and fetch profile
      try {
        // Validate tokens and get identity
        const identity = await validateTokens(tokensToUse)

        // Fetch and cache profile (pass tokens directly to avoid store timing issues)
        const userProfile = await fetchProfile(identity.username, tokensToUse)

        // Update gravatar email from profile if not already set
        if (!latestGravatarEmailRef.current && userProfile.email) {
          latestGravatarEmailRef.current = userProfile.email
          setGravatarEmail(userProfile.email)
        }

        // Store tokens if new ones were provided
        if (tokens) {
          setTokens(tokens)
        }

        setSessionActive(true)
        setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          isLoading: false,
          oauthTokens: tokensToUse
        }))
      } catch (error) {
        // Tokens are invalid or expired - fully disconnect
        disconnectStore()
        clearProfile()

        setState({
          isAuthenticated: false,
          isLoading: false,
          isOnline,
          hasStoredTokens: false,
          oauthTokens: null
        })
        throw error
      }
    },
    [
      authTokens,
      isOnline,
      queryClient,
      validateTokens,
      fetchProfile,
      setGravatarEmail,
      setTokens,
      setSessionActive,
      disconnectStore,
      clearProfile
    ]
  )

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (!authTokens) {
        // No OAuth tokens, user is not authenticated
        setState({
          isAuthenticated: false,
          isLoading: false,
          isOnline,
          hasStoredTokens: false,
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
          isOnline,
          hasStoredTokens: true,
          oauthTokens: null
        })
        return
      }

      // Session was active
      if (!isOnline) {
        // Offline with active session - check for cached profile before trusting
        const cachedProfile = queryClient.getQueryData<UserProfile>([
          'userProfile'
        ])
        if (!cachedProfile) {
          // No cached profile - fall back to "Welcome back" flow
          // User will need to go online to continue
          setState({
            isAuthenticated: false,
            isLoading: false,
            isOnline: false,
            hasStoredTokens: true,
            oauthTokens: null
          })
          return
        }

        // Offline with cached profile - trust cached state
        setState({
          isAuthenticated: true,
          isLoading: false,
          isOnline: false,
          hasStoredTokens: true,
          oauthTokens: authTokens
        })
        return
      }

      // Online with active session - validate tokens
      try {
        await validateOAuthTokens(authTokens)
      } catch {
        // Error already handled by validateOAuthTokens
      }
    }

    void initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount; dependencies would cause re-runs
  }, [])

  // Revalidate tokens when coming back online
  useEffect(() => {
    // Only trigger when:
    // - We just came online (isOnline is true)
    // - We have an active session
    // - We're currently authenticated
    // - We have tokens to validate
    if (isOnline && sessionActive && state.isAuthenticated && authTokens) {
      validateOAuthTokens(authTokens).catch(() => {
        // Token validation failed - already handled by validateOAuthTokens
        // which calls disconnect on failure
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Only trigger on isOnline change
  }, [isOnline])

  /**
   * Sign out - ends session but preserves OAuth tokens.
   * User will see "Welcome back" flow on next login.
   */
  const signOut = useCallback((): void => {
    signOutStore()

    setState((prev) => ({
      ...prev,
      isAuthenticated: false,
      isLoading: false,
      oauthTokens: null
    }))
  }, [signOutStore])

  /**
   * Disconnect - fully removes Discogs authorization.
   * Clears all tokens, profile cache, and IndexedDB data.
   */
  const disconnect = useCallback((): void => {
    // Store's disconnect() handles token and preference cleanup
    disconnectStore()

    // Clear TanStack Query in-memory cache
    queryClient.clear()

    // Clear IndexedDB via the persister
    void queryPersister.removeClient()

    // Clear browser caches for sensitive data (scoped to data caches only)
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
      isOnline,
      hasStoredTokens: false,
      oauthTokens: null
    })
  }, [disconnectStore, queryClient, isOnline])

  const value = useMemo(
    () => ({
      ...state,
      validateOAuthTokens,
      establishSession,
      signOut,
      disconnect
    }),
    [state, validateOAuthTokens, establishSession, signOut, disconnect]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
