import { useIsRestoring, useQueryClient } from '@tanstack/react-query'
import { TRPCClientError } from '@trpc/client'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { useCrossTabAuthSync } from '@/hooks/use-cross-tab-auth-sync'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePreferences } from '@/hooks/use-preferences'
import {
  type UserProfile,
  USER_PROFILE_QUERY_KEY,
  useUserProfile
} from '@/hooks/use-user-profile'
import { queryPersister } from '@/lib/query-persister'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth-store'

import { AuthContext, type AuthState } from './auth-context'

/**
 * Checks if a tRPC error indicates invalid OAuth tokens.
 * Returns true for UNAUTHORIZED (401) and FORBIDDEN (403) errors.
 * Returns false for transient errors (5xx, network issues) that should not trigger logout.
 */
function isAuthError(error: unknown): boolean {
  if (!(error instanceof TRPCClientError)) {
    return false
  }
  const data: unknown = error.data
  if (typeof data === 'object' && data !== null && 'code' in data) {
    const code = (data as { code: unknown }).code
    return code === 'UNAUTHORIZED' || code === 'FORBIDDEN'
  }
  return false
}

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

  // Track if IndexedDB cache is still being restored
  const isRestoring = useIsRestoring()

  // User profile from TanStack Query
  const { fetchProfile, clearProfile } = useUserProfile()

  // Query client for cache management
  const queryClient = useQueryClient()

  // Track previous tokens to detect changes (for cross-account leakage prevention)
  const prevTokensRef = useRef(authTokens)

  // Track if we've completed initialization to avoid repeated network validation
  const hasInitializedRef = useRef(false)

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
      // Tokens changed without disconnect - clear stale profile and require re-validation
      clearProfile()
      hasInitializedRef.current = false
    }
    prevTokensRef.current = authTokens
  }, [authTokens, clearProfile])

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

      // Step 1: Validate tokens
      let identity: { username: string; id: number }
      try {
        identity = await validateTokens(tokensToValidate)
      } catch (error) {
        // Only disconnect on auth errors (401/403) - tokens are definitively invalid
        if (isAuthError(error)) {
          disconnectStore()

          // Clear TanStack Query in-memory cache
          queryClient.clear()

          // Clear IndexedDB via the persister
          void queryPersister.removeClient()

          // Clear browser caches for sensitive data
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
        } else {
          // Transient error (network, 5xx) - keep tokens, try to use cached state
          console.warn(
            'Token validation failed due to transient error, will retry later:',
            error
          )

          // If we have a cached profile, trust it and authenticate (like offline mode)
          const cachedProfile = queryClient.getQueryData<UserProfile>(
            USER_PROFILE_QUERY_KEY
          )
          if (cachedProfile) {
            // Store tokens if new ones were provided
            if (tokens) {
              setTokens(tokensToValidate)
            }

            setSessionActive(true)
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              isLoading: false,
              oauthTokens: tokensToValidate
            }))
            // Don't throw - we successfully recovered using cached state
            return
          }

          // No cached profile - can't authenticate, but keep tokens for retry
          setState((prev) => ({
            ...prev,
            isLoading: false,
            hasStoredTokens: true
          }))
        }
        throw error
      }

      // Step 2: Fetch profile if not cached - failure here is non-fatal
      // (tokens are valid, profile can be fetched later)
      const cachedProfile = queryClient.getQueryData<UserProfile>(
        USER_PROFILE_QUERY_KEY
      )
      if (!cachedProfile) {
        try {
          const userProfile = await fetchProfile(
            identity.username,
            tokensToValidate
          )

          // Update gravatar email from profile if not already set
          if (!latestGravatarEmailRef.current && userProfile.email) {
            latestGravatarEmailRef.current = userProfile.email
            setGravatarEmail(userProfile.email)
          }
        } catch (profileError) {
          // Profile fetch failed but tokens are valid - set minimal profile from identity
          // This allows collection loading to work (requires username)
          console.warn(
            'Profile fetch failed during token validation, using identity data:',
            profileError
          )
          const minimalProfile: UserProfile = {
            id: identity.id,
            username: identity.username
          }
          queryClient.setQueryData(USER_PROFILE_QUERY_KEY, minimalProfile)
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
        const cachedProfile = queryClient.getQueryData<UserProfile>(
          USER_PROFILE_QUERY_KEY
        )
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

      // Step 1: Validate tokens
      let identity: { username: string; id: number }
      try {
        identity = await validateTokens(tokensToUse)
      } catch (error) {
        // Only disconnect on auth errors (401/403) - tokens are definitively invalid
        if (isAuthError(error)) {
          disconnectStore()

          // Clear TanStack Query in-memory cache
          queryClient.clear()

          // Clear IndexedDB via the persister
          void queryPersister.removeClient()

          // Clear browser caches for sensitive data
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
        } else {
          // Transient error (network, 5xx) - keep tokens, try to use cached state
          console.warn(
            'Token validation failed due to transient error, will retry later:',
            error
          )

          // If we have a cached profile, trust it and authenticate (like offline mode)
          const cachedProfile = queryClient.getQueryData<UserProfile>(
            USER_PROFILE_QUERY_KEY
          )
          if (cachedProfile) {
            // Store tokens if new ones were provided
            if (tokens) {
              setTokens(tokensToUse)
            }

            setSessionActive(true)
            setState((prev) => ({
              ...prev,
              isAuthenticated: true,
              isLoading: false,
              oauthTokens: tokensToUse
            }))
            // Don't throw - we successfully recovered using cached state
            return
          }

          // No cached profile - can't authenticate, but keep tokens for retry
          setState((prev) => ({
            ...prev,
            isLoading: false,
            hasStoredTokens: true
          }))
        }
        throw error
      }

      // Step 2: Fetch profile - failure here is non-fatal
      // (tokens are valid, profile can be fetched later)
      try {
        const userProfile = await fetchProfile(identity.username, tokensToUse)

        // Update gravatar email from profile if not already set
        if (!latestGravatarEmailRef.current && userProfile.email) {
          latestGravatarEmailRef.current = userProfile.email
          setGravatarEmail(userProfile.email)
        }
      } catch (profileError) {
        // Profile fetch failed but tokens are valid - set minimal profile from identity
        // This allows collection loading to work (requires username)
        console.warn(
          'Profile fetch failed during session establishment, using identity data:',
          profileError
        )
        const minimalProfile: UserProfile = {
          id: identity.id,
          username: identity.username
        }
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, minimalProfile)
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
      disconnectStore
    ]
  )

  // Initialize auth after both IndexedDB and Zustand hydration complete
  // Dependencies include authTokens/sessionActive to handle Zustand hydrating after isRestoring
  useEffect(() => {
    // Wait for IndexedDB restoration before making auth decisions
    // This prevents false "Welcome back" flows when cached profile exists
    if (isRestoring) {
      return
    }

    const initializeAuth = async () => {
      if (!authTokens) {
        // No OAuth tokens, user is not authenticated
        hasInitializedRef.current = false
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
        hasInitializedRef.current = false
        setState({
          isAuthenticated: false,
          isLoading: false,
          isOnline,
          hasStoredTokens: true,
          oauthTokens: null
        })
        return
      }

      // Skip network validation if already initialized with these tokens
      // This prevents repeated API calls when effect re-runs
      if (hasInitializedRef.current && state.isAuthenticated) {
        return
      }

      // Session was active
      if (!isOnline) {
        // Offline with active session - check for cached profile before trusting
        const cachedProfile = queryClient.getQueryData<UserProfile>(
          USER_PROFILE_QUERY_KEY
        )
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
        hasInitializedRef.current = true
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
        hasInitializedRef.current = true
      } catch {
        // Error already handled by validateOAuthTokens
        hasInitializedRef.current = false
      }
    }

    void initializeAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Includes auth state for Zustand hydration; network validation guarded by hasInitializedRef
  }, [isRestoring, authTokens, sessionActive])

  // Clear all caches (used by cross-tab disconnect)
  const clearAllCaches = useCallback(() => {
    // Clear TanStack Query in-memory cache
    queryClient.clear()

    // Clear IndexedDB via the persister
    void queryPersister.removeClient()

    // Clear browser caches for sensitive data
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
  }, [queryClient])

  // Sync derived auth state when Zustand store changes (cross-tab sync)
  useCrossTabAuthSync({
    authTokens,
    sessionActive,
    isRestoring,
    state,
    setState,
    onCrossTabDisconnect: clearAllCaches
  })

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
