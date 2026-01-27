import { useIsRestoring, useQueryClient } from '@tanstack/react-query'
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
import { CACHE_NAMES } from '@/lib/constants'
import { isAuthError, OfflineNoCacheError } from '@/lib/errors'
import { queryPersister } from '@/lib/query-persister'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth-store'

import { AuthContext, type AuthState } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Provides authentication state and methods to the app.
 * Handles OAuth token validation, session management, and cross-tab sync.
 *
 * @param props - Component props
 * @param props.children - The app component tree
 * @returns Provider wrapper with auth context
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
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

  // Track previous online state to detect offline→online transitions
  const wasOnlineRef = useRef(isOnline)

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
   * Clears all cached data: TanStack Query, IndexedDB, and browser caches.
   * Used during disconnect, auth errors, and cross-tab sync.
   *
   * Cache clearing is deferred to the next microtask to prevent React warnings
   * about updating components (e.g., CollectionSyncBanner) while rendering
   * another component (AuthProvider). This happens because queryClient.clear()
   * synchronously notifies cache subscribers via useSyncExternalStore.
   */
  const clearAllCaches = useCallback(() => {
    queueMicrotask(() => {
      // Clear TanStack Query in-memory cache
      queryClient.clear()

      // Clear IndexedDB via the persister (errors handled internally)
      void queryPersister.removeClient()

      // Clear browser caches for sensitive data
      if ('caches' in window) {
        Object.values(CACHE_NAMES).forEach((name) => {
          caches.delete(name).catch(() => {
            // Ignore errors if cache doesn't exist
          })
        })
      }
    })
  }, [queryClient])

  /**
   * Validates OAuth tokens in the background without affecting loading state.
   * Used for optimistic auth - user sees authenticated UI immediately,
   * validation happens silently. Only disconnects on definitive auth errors (401/403).
   */
  const validateTokensInBackground = useCallback(
    (tokens: { accessToken: string; accessTokenSecret: string }) => {
      void (async () => {
        try {
          const identity = await validateTokens(tokens)
          // Tokens valid - ensure profile is cached
          const cachedProfile = queryClient.getQueryData<UserProfile>(
            USER_PROFILE_QUERY_KEY
          )
          if (!cachedProfile) {
            try {
              const userProfile = await fetchProfile(identity.username, tokens)
              if (!latestGravatarEmailRef.current && userProfile.email) {
                latestGravatarEmailRef.current = userProfile.email
                setGravatarEmail(userProfile.email)
              }
            } catch {
              // Profile fetch failed but tokens are valid - set minimal profile
              const minimalProfile: UserProfile = {
                id: identity.id,
                username: identity.username
              }
              queryClient.setQueryData(USER_PROFILE_QUERY_KEY, minimalProfile)
            }
          }
        } catch (error: unknown) {
          // Only disconnect on auth errors (401/403) - tokens are definitively invalid
          if (isAuthError(error)) {
            disconnectStore()
            clearAllCaches()
            setState({
              isAuthenticated: false,
              isLoading: false,
              isOnline,
              hasStoredTokens: false,
              oauthTokens: null
            })
          }
          // Transient errors are silently ignored - user stays authenticated
          // and we'll retry on next opportunity (window focus, etc.)
        }
      })()
    },
    [
      validateTokens,
      queryClient,
      fetchProfile,
      setGravatarEmail,
      disconnectStore,
      clearAllCaches,
      isOnline
    ]
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
          clearAllCaches()

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
      clearAllCaches,
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
          throw new OfflineNoCacheError()
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
          clearAllCaches()

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
      clearAllCaches,
      queryClient,
      validateTokens,
      fetchProfile,
      setGravatarEmail,
      setTokens,
      setSessionActive,
      disconnectStore
    ]
  )

  // Initialize auth - Zustand hydrates synchronously from localStorage,
  // so we can be optimistic immediately if tokens + sessionActive exist
  useEffect(() => {
    // Skip re-initialization if already initialized
    if (hasInitializedRef.current && state.isAuthenticated) {
      return
    }

    // No tokens - user is not authenticated
    if (!authTokens) {
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

    // Tokens exist but session not active - show "Welcome back" flow
    if (!sessionActive) {
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

    // OFFLINE GUARD: Wait for IndexedDB hydration before making auth decisions
    // We need to know if cached profile exists before authenticating offline
    if (!isOnline && isRestoring) {
      // Keep showing loading state until hydration completes
      // Effect will re-run when isRestoring becomes false
      return
    }

    // OFFLINE WITHOUT CACHE: Cannot authenticate - no way to get username
    // Fall back to "Welcome back" flow so user can re-authenticate when online
    if (!isOnline) {
      const cachedProfile = queryClient.getQueryData<UserProfile>(
        USER_PROFILE_QUERY_KEY
      )
      if (!cachedProfile) {
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
    }

    // OPTIMISTIC AUTH: tokens + sessionActive = authenticate immediately
    // Profile will load from IndexedDB in background, components handle their own loading
    hasInitializedRef.current = true
    setState({
      isAuthenticated: true,
      isLoading: false,
      isOnline,
      hasStoredTokens: true,
      oauthTokens: authTokens
    })

    // If online, validate tokens in background (user won't see a loader)
    // If validation fails (401/403), user will be disconnected
    if (isOnline) {
      validateTokensInBackground(authTokens)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Network validation guarded by hasInitializedRef; isRestoring and queryClient are stable refs
  }, [authTokens, sessionActive, isOnline, isRestoring])

  // Sync derived auth state when Zustand store changes (cross-tab sync)
  useCrossTabAuthSync({
    authTokens,
    sessionActive,
    isRestoring,
    state,
    setState,
    onCrossTabDisconnect: clearAllCaches
  })

  // Revalidate tokens when coming back online (background validation, no loader)
  useEffect(() => {
    const wasOffline = !wasOnlineRef.current
    wasOnlineRef.current = isOnline

    // Only trigger on offline→online transition with active authenticated session
    if (
      wasOffline &&
      isOnline &&
      sessionActive &&
      state.isAuthenticated &&
      authTokens
    ) {
      validateTokensInBackground(authTokens)
    }
  }, [
    isOnline,
    sessionActive,
    state.isAuthenticated,
    authTokens,
    validateTokensInBackground
  ])

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
    clearAllCaches()

    setState({
      isAuthenticated: false,
      isLoading: false,
      isOnline,
      hasStoredTokens: false,
      oauthTokens: null
    })
  }, [disconnectStore, clearAllCaches, isOnline])

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
