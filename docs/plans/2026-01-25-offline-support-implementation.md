# Offline Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add offline-first PWA support by restructuring auth/profile storage, reducing API calls, and adding online/offline status indicators.

**Architecture:** Move user profile from Zustand (localStorage) to TanStack Query (IndexedDB) for unified caching. Auth provider becomes offline-aware: skips validation when offline, trusts cached state. Online status tracked via React state (ephemeral, no persistence).

**Tech Stack:** TanStack Query with IndexedDB persistence, Zustand for auth tokens only, navigator.onLine API with event listeners, shadcn AvatarBadge component.

---

## Task 1: Create useOnlineStatus Hook

**Files:**

- Create: `src/hooks/use-online-status.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/use-online-status.ts
import { useEffect, useState } from 'react'

/**
 * Tracks browser online/offline status.
 * Uses navigator.onLine and listens to online/offline events.
 *
 * Note: navigator.onLine can report true when connected to WiFi but without
 * internet access. This is acceptable - failed API calls will be handled
 * by the auth provider.
 *
 * @returns Current online status
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

**Step 2: Run lint to verify**

Run: `bun run lint src/hooks/use-online-status.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-online-status.ts
git commit -m "feat: add useOnlineStatus hook for network status tracking"
```

---

## Task 2: Create useUserProfile Hook

**Files:**

- Create: `src/hooks/use-user-profile.ts`

**Step 1: Write the hook**

```typescript
// src/hooks/use-user-profile.ts
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { trpc } from '@/lib/trpc'

export interface UserProfile {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

/**
 * Manages user profile data via TanStack Query cache.
 * Profile is persisted to IndexedDB for offline access.
 *
 * - Data is set manually via fetchProfile(), not via useQuery
 * - Call fetchProfile() on login/continue/reconnect
 * - Profile is cleared when disconnect() is called
 *
 * Note: We use queryClient directly instead of useQuery because:
 * 1. Profile should only be fetched explicitly, not via refetch()
 * 2. We need to pass tokens directly (not read from store) to avoid timing issues
 * 3. We want manual control over loading state
 */
export function useUserProfile() {
  const queryClient = useQueryClient()
  const trpcUtils = trpc.useUtils()
  const [isFetching, setIsFetching] = useState(false)

  // Read profile directly from query cache
  const profile = queryClient.getQueryData<UserProfile>(['userProfile'])

  /**
   * Fetches profile from API and caches it.
   * Call after successful token validation.
   *
   * @param username - The username to fetch profile for
   * @param tokens - OAuth tokens to use for the request (passed directly to avoid store timing issues)
   * @returns The fetched user profile
   */
  const fetchProfile = async (
    username: string,
    tokens: { accessToken: string; accessTokenSecret: string }
  ): Promise<UserProfile> => {
    setIsFetching(true)
    try {
      const { profile } = await trpcUtils.client.discogs.getUserProfile.query({
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret,
        username
      })

      const userProfile: UserProfile = {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        email: profile.email
      }

      queryClient.setQueryData(['userProfile'], userProfile)
      return userProfile
    } finally {
      setIsFetching(false)
    }
  }

  /**
   * Clears profile from cache.
   * Called during disconnect flow.
   */
  const clearProfile = () => {
    queryClient.removeQueries({ queryKey: ['userProfile'] })
  }

  return {
    profile,
    isFetching,
    fetchProfile,
    clearProfile
  }
}
```

**Step 2: Run lint to verify**

Run: `bun run lint src/hooks/use-user-profile.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-user-profile.ts
git commit -m "feat: add useUserProfile hook with IndexedDB persistence"
```

---

## Task 3: Add AvatarBadge Component

**Files:**

- Modify: `src/components/ui/avatar.tsx`

**Note:** This is shadcn-generated code that should not have local modifications. The `--overwrite` flag is acceptable here. If you have made custom modifications to this file, add AvatarBadge manually instead.

**Step 1: Back up current avatar component**

Run: `cp src/components/ui/avatar.tsx src/components/ui/avatar.tsx.bak`

**Step 2: Run shadcn update to get latest avatar**

Run: `bunx shadcn@latest add avatar --overwrite`

**Step 3: Check if AvatarBadge was added**

If `AvatarBadge` was NOT added by shadcn (check the file), manually add it:

```typescript
const AvatarBadge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => {
  return (
    <span
      ref={ref}
      data-slot="avatar-badge"
      className={cn(
        'absolute right-0 bottom-0 size-3 rounded-full border-2 border-background',
        className
      )}
      {...props}
    />
  )
})
AvatarBadge.displayName = 'AvatarBadge'

export { Avatar, AvatarImage, AvatarFallback, AvatarBadge }
```

**Step 4: Verify existing avatar usages still work**

Run: `bun run build`
Expected: No type errors related to Avatar components

**Step 5: Remove backup**

Run: `rm src/components/ui/avatar.tsx.bak`

**Step 6: Commit**

```bash
git add src/components/ui/avatar.tsx
git commit -m "feat: add AvatarBadge component for status indicators"
```

---

## Task 4: Simplify Auth Store (Remove Profile Fields)

**Files:**

- Modify: `src/stores/auth-store.ts`

**Step 1: Update auth store to remove profile fields**

Replace the entire file content with:

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { STORAGE_KEYS } from '@/lib/storage-keys'
import { usePreferencesStore } from '@/stores/preferences-store'

interface AuthTokens {
  accessToken: string
  accessTokenSecret: string
}

interface AuthStore {
  // State
  tokens: AuthTokens | null
  sessionActive: boolean

  // Actions
  setTokens: (tokens: AuthTokens) => void
  setSessionActive: (active: boolean) => void
  signOut: () => void
  disconnect: () => void
}

/**
 * Zustand store for authentication state.
 * Automatically persists to localStorage under 'vinyldeck-auth' key.
 *
 * Note: User profile is stored separately in TanStack Query (IndexedDB)
 * via the useUserProfile hook. This store only manages auth credentials.
 *
 * Two-tier auth system:
 * - signOut(): Ends session, keeps tokens for "welcome back"
 * - disconnect(): Clears everything, requires re-authorization
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      tokens: null,
      sessionActive: false,

      setTokens: (tokens) => set({ tokens }),

      setSessionActive: (active) => set({ sessionActive: active }),

      // Sign out: clear session, keep tokens for "welcome back"
      signOut: () => set({ sessionActive: false }),

      // Disconnect: clear auth tokens (profile cleanup done by auth provider)
      disconnect: () => {
        // Reset avatar preferences to prevent cross-account data leakage
        usePreferencesStore.getState().resetAvatarSettings()

        set({
          tokens: null,
          sessionActive: false
        })
      }
    }),
    { name: STORAGE_KEYS.AUTH }
  )
)
```

**Step 2: Run lint**

Run: `bun run lint src/stores/auth-store.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/stores/auth-store.ts
git commit -m "refactor: simplify auth store, move profile to TanStack Query"
```

---

## Task 5: Update AuthContext Interface

**Files:**

- Modify: `src/providers/auth-context.ts`

**Step 1: Update interface**

Replace the entire file content with:

```typescript
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
```

**Step 2: Run lint**

Run: `bun run lint src/providers/auth-context.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/providers/auth-context.ts
git commit -m "refactor: update AuthContext with offline-aware interface"
```

---

## Task 6: Update AuthProvider with Offline Logic

**Files:**

- Modify: `src/providers/auth-provider.tsx`

**Critical design decisions addressed:**

1. **Offline "Continue" flow**: `establishSession` has an offline branch that trusts cached profile
2. **Reconnect revalidation**: Effect watches `isOnline` and validates when coming back online
3. **Auth without profile**: After validation, checks for cached profile and fetches if missing
4. **Token change detection**: Clears stale profile when tokens change unexpectedly

**Step 1: Rewrite auth provider with offline support**

Replace the entire file content with:

```typescript
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
        prevTokensRef.current.accessTokenSecret !== authTokens.accessTokenSecret)
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
          const userProfile = await fetchProfile(identity.username, tokensToValidate)

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
```

**Step 2: Run lint**

Run: `bun run lint src/providers/auth-provider.tsx`
Expected: No errors

**Step 3: Run build to check for type errors**

Run: `bun run build`
Expected: Type errors in consuming files (this is expected, we'll fix them next)

**Step 4: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor: update AuthProvider with offline-aware validation"
```

---

## Task 7: Update useAuth Hook

**Files:**

- Modify: `src/hooks/use-auth.ts`

**Step 1: Read current hook**

Read the file first to understand its structure.

**Step 2: Update hook to use new interface**

The hook should still work since it just uses the context. Verify the types match by checking:

```typescript
import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/providers/auth-context'

/**
 * Hook to access authentication state and actions.
 *
 * @returns Authentication context value
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Step 3: Run lint**

Run: `bun run lint src/hooks/use-auth.ts`
Expected: No errors

**Step 4: Commit (if changes needed)**

```bash
git add src/hooks/use-auth.ts
git commit -m "refactor: update useAuth hook for new AuthContext interface"
```

---

## Task 8: Update SidebarUser Component

**Files:**

- Modify: `src/components/layout/sidebar-user.tsx`

**Step 1: Update to use useUserProfile and add online indicator**

Key changes:

1. Import `useOnlineStatus` and `useUserProfile`
2. Import `AvatarBadge`
3. Get `profile` from `useUserProfile()` instead of `useAuth()`
4. Get `isOnline` from `useOnlineStatus()`
5. Add `AvatarBadge` with conditional styling

Replace the relevant imports and component logic:

```typescript
import {
  Link,
  useLocation,
  useNavigate,
  useRouterState
} from '@tanstack/react-router'
import { LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { usePreferences } from '@/hooks/use-preferences'
import { useUserProfile } from '@/hooks/use-user-profile'
import { storeRedirectUrl } from '@/lib/redirect-utils'

import type { MouseEvent } from 'react'

export function SidebarUser(): React.JSX.Element {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const { profile } = useUserProfile()
  const isOnline = useOnlineStatus()
  const { avatarSource, gravatarUrl } = usePreferences()
  const navigate = useNavigate()
  const location = useRouterState({ select: (s) => s.location })
  const routeLocation = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  const username = profile?.username
  const avatarUrl = profile?.avatar_url

  const isActive = (path: string) =>
    routeLocation.pathname === path ||
    routeLocation.pathname.startsWith(`${path}/`)

  const handleNavClick =
    (path: string) => (event: MouseEvent<HTMLAnchorElement>) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button === 1
      ) {
        return
      }

      if (isActive(path)) {
        event.preventDefault()
      }

      if (isMobile) {
        setOpenMobile(false)
      }
    }

  const handleSignOut = () => {
    const currentUrl = location.pathname + location.searchStr + location.hash
    storeRedirectUrl(currentUrl)

    signOut()
    toast.success(t('auth.signOutSuccess'))
    void navigate({ to: '/login' })

    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const initials = username
    ? username
        .split(/[\s_-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  const preferredAvatar = avatarSource === 'gravatar' ? gravatarUrl : avatarUrl
  const fallbackAvatar = avatarSource === 'gravatar' ? avatarUrl : gravatarUrl
  const resolvedAvatar = preferredAvatar || fallbackAvatar

  return (
    <SidebarMenu>
      {/* Settings */}
      <SidebarMenuItem>
        <SidebarMenuButton
          asChild
          isActive={isActive('/settings')}
          tooltip={t('nav.settings')}
        >
          <Link
            to="/settings"
            viewTransition
            onClick={handleNavClick('/settings')}
          >
            <Settings />
            <span>{t('nav.settings')}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* Sign Out */}
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleSignOut} tooltip={t('auth.signOut')}>
          <LogOut />
          <span>{t('auth.signOut')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {/* User info row */}
      <SidebarMenuItem>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0! [&>span:last-child]:truncate">
          <Avatar className="h-8 w-8 rounded-lg group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
            {resolvedAvatar ? (
              <AvatarImage
                src={resolvedAvatar}
                alt={username ?? t('user.fallback')}
                className="rounded-lg object-cover"
              />
            ) : null}
            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
            <AvatarBadge
              className={
                isOnline
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-muted-foreground/50'
              }
            />
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate font-medium">{username}</span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

**Step 2: Run lint**

Run: `bun run lint src/components/layout/sidebar-user.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/layout/sidebar-user.tsx
git commit -m "feat: update SidebarUser with online status indicator"
```

---

## Task 9: Update useCollection Hook

**Files:**

- Modify: `src/hooks/use-collection.ts`

**Step 1: Update to get username from useUserProfile**

Change the import and usage:

From:

```typescript
const { username, oauthTokens } = useAuth()
```

To:

```typescript
const { oauthTokens } = useAuth()
const { profile } = useUserProfile()
const username = profile?.username
```

Add import:

```typescript
import { useUserProfile } from '@/hooks/use-user-profile'
```

**Step 2: Run lint**

Run: `bun run lint src/hooks/use-collection.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-collection.ts
git commit -m "refactor: update useCollection to use useUserProfile"
```

---

## Task 10: Update useCollectionSync Hook

**Files:**

- Modify: `src/hooks/use-collection-sync.ts`

**Step 1: Update to get username from useUserProfile**

Change:

From:

```typescript
const username = useAuthStore((state) => state.username)
```

To:

```typescript
import { useUserProfile } from '@/hooks/use-user-profile'
// ...
const { profile } = useUserProfile()
const username = profile?.username
```

Remove the old import if no longer needed:

```typescript
// Remove if username was the only thing used from auth store
const tokens = useAuthStore((state) => state.tokens)
```

**Step 2: Run lint**

Run: `bun run lint src/hooks/use-collection-sync.ts`
Expected: No errors

**Step 3: Commit**

```bash
git add src/hooks/use-collection-sync.ts
git commit -m "refactor: update useCollectionSync to use useUserProfile"
```

---

## Task 11: Update Login Page

**Files:**

- Modify: `src/routes/login.tsx`

**Critical design decision:** When offline without cached profile, the "Continue" button should be disabled with an explanation. The user cannot continue offline if we have no cached data to show them.

**Step 1: Update to use new auth interface and useUserProfile**

Key changes:

1. Import `useUserProfile` and `useOnlineStatus`
2. Get cached profile from `useUserProfile()` instead of `useAuthStore`
3. Use `useAuth().hasStoredTokens` instead of checking `existingTokens`
4. Use `disconnect` from `useAuth()` instead of `disconnectStore` from Zustand
5. Call `establishSession` instead of `validateOAuthTokens` for "Continue" flow
6. Disable "Continue" when offline AND no cached profile exists
7. Handle the specific error from `establishSession` when offline without cache

Update imports:

```typescript
import { useAuth } from '@/hooks/use-auth'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useUserProfile } from '@/hooks/use-user-profile'
```

Update component logic:

```typescript
function LoginPage(): React.JSX.Element {
  const { t } = useTranslation()
  const {
    isAuthenticated,
    hasStoredTokens,
    isOnline,
    establishSession,
    disconnect
  } = useAuth()
  const { profile } = useUserProfile()
  const navigate = useNavigate()

  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSwitchDialog, setShowSwitchDialog] = useState(false)

  // Get cached profile data for "Welcome back" flow
  const username = profile?.username
  const cachedAvatarUrl = profile?.avatar_url

  // Show "Welcome back" if tokens exist (even without cached profile when online)
  // When online without cached profile, establishSession will fetch it
  const hasExistingSession = hasStoredTokens

  // Can only continue offline if we have cached profile data
  const canContinue = isOnline || profile !== undefined
  const cannotContinue = !isOnline && profile === undefined

  // Use cached username for display, or a generic greeting if missing
  const displayName = username ?? t('auth.welcomeBackGeneric')
  const initials = username ? username.slice(0, 2).toUpperCase() : '?'

  // ... rest of component (getRequestToken, useEffect for redirect, etc.)

  const handleContinue = async () => {
    setIsValidating(true)
    setError(null)

    try {
      await establishSession()
      // Navigation handled by isAuthenticated effect
    } catch (err) {
      // Handle specific offline error
      const errorMessage =
        err instanceof Error &&
        err.message === 'Cannot continue offline without cached profile'
          ? t('auth.offlineNoCachedData')
          : t('auth.oauthSessionExpired')
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsValidating(false)
    }
  }

  const handleUseDifferentAccount = () => {
    setShowSwitchDialog(false)
    setError(null)
    disconnect() // Use disconnect from useAuth, not from store directly
    void handleOAuthLogin()
  }

  // In JSX, update the Welcome back section:
  // - Use displayName instead of storedUsername (handles missing profile gracefully)
  // - Use cachedAvatarUrl for avatar (may be undefined if profile not cached)
  // - Disable Continue button when cannotContinue is true
  // - Show offline hint when cannotContinue

  // Example welcome back section:
  // <p className="text-lg font-medium">
  //   {username
  //     ? t('auth.welcomeBack', { username })
  //     : t('auth.welcomeBackGeneric')}
  // </p>

  // Example button update:
  // <Button
  //   onClick={() => void handleContinue()}
  //   className="w-full"
  //   size="lg"
  //   disabled={isValidating || isLoading || cannotContinue}
  // >
  //   ...
  // </Button>
  //
  // Add hint below button when offline without cache:
  // {cannotContinue && (
  //   <p className="text-muted-foreground text-center text-xs">
  //     {t('auth.offlineCannotContinue')}
  //   </p>
  // )}
}
```

**Step 2: Add translation keys**

Add to `src/locales/en/translation.json`:

```json
{
  "auth": {
    "offlineNoCachedData": "Cannot continue offline. Please connect to the internet.",
    "offlineCannotContinue": "You're offline. Connect to the internet to continue.",
    "welcomeBackGeneric": "Welcome back"
  }
}
```

Add to `src/locales/nb/translation.json`:

```json
{
  "auth": {
    "offlineNoCachedData": "Kan ikke fortsette uten internett. Koble til for å fortsette.",
    "offlineCannotContinue": "Du er frakoblet. Koble til internett for å fortsette.",
    "welcomeBackGeneric": "Velkommen tilbake"
  }
}
```

**Step 3: Run lint**

Run: `bun run lint src/routes/login.tsx`
Expected: No errors

**Step 4: Commit**

```bash
git add src/routes/login.tsx src/locales/en/translation.json src/locales/nb/translation.json
git commit -m "refactor: update login page for offline-aware auth"
```

---

## Task 12: Update OAuth Callback

**Files:**

- Modify: `src/routes/oauth-callback.tsx`

**Step 1: Update to call establishSession**

Change `validateOAuthTokens` to `establishSession`:

From:

```typescript
const { validateOAuthTokens } = useAuth()
// ...
await validateOAuthTokens(tokens)
```

To:

```typescript
const { establishSession } = useAuth()
// ...
await establishSession(tokens)
```

**Step 2: Run lint**

Run: `bun run lint src/routes/oauth-callback.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/oauth-callback.tsx
git commit -m "refactor: update OAuth callback to use establishSession"
```

---

## Task 13: Update Settings Page

**Files:**

- Modify: `src/routes/_authenticated/settings.tsx`

**Step 1: Update to use useUserProfile for profile data**

Change:

From:

```typescript
const { username, avatarUrl, disconnect } = useAuth()
```

To:

```typescript
const { disconnect } = useAuth()
const { profile } = useUserProfile()
const username = profile?.username
const avatarUrl = profile?.avatar_url
```

Add import:

```typescript
import { useUserProfile } from '@/hooks/use-user-profile'
```

**Step 2: Run lint**

Run: `bun run lint src/routes/_authenticated/settings.tsx`
Expected: No errors

**Step 3: Commit**

```bash
git add src/routes/_authenticated/settings.tsx
git commit -m "refactor: update settings page to use useUserProfile"
```

---

## Task 14: Final Build Verification

**Step 1: Run full lint**

Run: `bun run lint`
Expected: No errors

**Step 2: Run build**

Run: `bun run build`
Expected: Build succeeds with no errors

**Step 3: Run Vercel build**

Run: `vercel build`
Expected: Build succeeds with no errors

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: fix any remaining build issues"
```

---

## Task 15: Manual Testing Scenarios

**Step 1: Test offline browsing**

1. Log in while online
2. Browse collection (data cached)
3. Open DevTools → Network → Offline
4. Refresh page
5. Expected: Collection loads from cache, avatar badge shows gray/muted

**Step 2: Test welcome back offline**

1. Log in while online
2. Sign out (not disconnect)
3. Go offline (DevTools → Network → Offline)
4. Open app
5. Expected: "Welcome back" shows with cached avatar
6. Click "Continue"
7. Expected: Enters app with cached data

**Step 3: Test account switch (data isolation)**

1. Log in as User A
2. Browse collection (cached)
3. Disconnect from Settings
4. Log in as User B
5. Expected: No User A data visible (IndexedDB was cleared)

**Step 4: Test coming back online**

1. Browse offline
2. Go online (DevTools → Network → Online)
3. Expected: Green badge appears, tokens validated in background

---

## Summary

This plan implements offline-first PWA support through:

1. **New hooks:** `useOnlineStatus` and `useUserProfile`
2. **Simplified auth store:** Tokens only, no profile duplication
3. **Updated AuthProvider:** Offline-aware validation with reconnect handling
4. **New UI:** AvatarBadge for online/offline status
5. **Bug fix:** IndexedDB cleared on disconnect via `queryPersister.removeClient()`
6. **Bug fix:** Login page uses shared disconnect function

**Critical safety measures (from design review):**

- **Offline "Continue" flow:** `establishSession` trusts cached profile when offline; throws error if no cache exists
- **Reconnect revalidation:** Effect watches `isOnline` and validates tokens when coming back online
- **Auth without profile fallback:** `validateOAuthTokens` fetches profile if cache is missing after validation
- **Cross-account leakage prevention:** Profile cache cleared when either token field changes unexpectedly
- **Login page offline UX:** "Continue" button disabled with explanation when offline without cached data
- **OAuth callback timing fix:** `fetchProfile` accepts tokens as parameter to avoid store timing issues
- **Offline init safety:** `initializeAuth` checks for cached profile before trusting offline session
- **Welcome-back graceful degradation:** Shows generic greeting when tokens exist but profile cache expired

Total files modified: 11 + 2 translation files
New files created: 2
