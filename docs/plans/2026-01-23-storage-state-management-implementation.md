# Storage & State Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Consolidate localStorage from 11 fragmented keys to 3 using Zustand, TanStack Query persistence, and next-themes for better UX and future aggregation support.

**Architecture:** Replace custom Context providers with Zustand stores for client state (auth, preferences), add IndexedDB persistence for TanStack Query cache, migrate to next-themes for FOUC-free theme switching, and add CSP headers for XSS protection.

**Tech Stack:** Zustand, TanStack Query Persister, IndexedDB (idb-keyval), next-themes, React 19

---

## Phase 1: Install Dependencies & Foundation

### Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

**Step 1: Install Zustand and TanStack Query persistence dependencies**

```bash
bun add zustand @tanstack/query-persist-client-core idb-keyval
```

Expected output: Dependencies added to package.json

**Step 2: Verify installation**

```bash
bun run build
```

Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add package.json bun.lockb
git commit -m "chore: add zustand and tanstack query persistence dependencies"
```

---

### Task 2: Create Storage Keys Constants

**Files:**

- Create: `src/lib/storage-keys.ts`

**Step 1: Create storage keys file**

```typescript
// src/lib/storage-keys.ts
/**
 * Consolidated storage key constants for VinylDeck.
 * Reduces 11 fragmented keys to 3 main keys.
 */
export const STORAGE_KEYS = {
  /** Zustand: OAuth tokens, session state, username, userId */
  AUTH: 'vinyldeck-auth',
  /** Zustand: viewMode, avatarSource, gravatarEmail */
  PREFERENCES: 'vinyldeck-prefs',
  /** next-themes: theme preference (light/dark/system) */
  THEME: 'vinyldeck-theme'
} as const

/**
 * Session storage keys for temporary OAuth flow state.
 */
export const SESSION_KEYS = {
  /** Temporary OAuth request token during authorization */
  OAUTH_REQUEST: 'vinyldeck-oauth-request',
  /** Post-login redirect URL preservation */
  REDIRECT_URL: 'vinyldeck-redirect'
} as const
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/storage-keys.ts
git commit -m "feat: add consolidated storage key constants"
```

---

### Task 3: Create IndexedDB Query Persister

**Files:**

- Create: `src/lib/query-persister.ts`

**Step 1: Create query persister file**

```typescript
// src/lib/query-persister.ts
import { get, set, del } from 'idb-keyval'

import type {
  PersistedClient,
  Persister
} from '@tanstack/query-persist-client-core'

/**
 * Creates an IndexedDB persister for TanStack Query.
 * Stores the entire query cache in IndexedDB for offline access.
 *
 * Uses the stable Persister interface with persistQueryClient, not the
 * experimental per-query createPersister API. This approach:
 * - Persists the full QueryClient cache to a single IndexedDB entry
 * - Works with persistQueryClient() for automatic save/restore
 * - Is production-ready and well-documented
 *
 * Benefits:
 * - No 5MB localStorage limit (critical for large collections)
 * - Async API (non-blocking)
 * - Persists across sessions
 *
 * @see https://tanstack.com/query/v5/docs/framework/react/plugins/persistQueryClient
 */
const IDB_KEY = 'tanstack-query-cache'

export const queryPersister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await set(IDB_KEY, client)
  },
  restoreClient: async () => {
    return await get<PersistedClient>(IDB_KEY)
  },
  removeClient: async () => {
    await del(IDB_KEY)
  }
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/query-persister.ts
git commit -m "feat: add IndexedDB query persister for TanStack Query"
```

---

### Task 4: Update QueryClient with Persister

**Files:**

- Modify: `src/providers/query-provider.tsx`

**Step 1: Add persistence imports**

Add the persistence imports at the top of the file:

```typescript
import {
  persistQueryClient,
  type PersistQueryClientOptions
} from '@tanstack/query-persist-client-core'
import {
  QueryClient,
  QueryClientProvider,
  keepPreviousData
} from '@tanstack/react-query'

import { queryPersister } from '@/lib/query-persister'
```

**Step 2: Create QueryClient with persistence**

Create the QueryClient and enable persistence using the stable `persistQueryClient` API:

```typescript
function createQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        placeholderData: keepPreviousData // Show old data during refetch
      }
    }
  })

  // Enable persistence to IndexedDB using the stable persistQueryClient API
  // Note: The experimental per-query createPersister API is different and not used here.
  // persistQueryClient restores cache on init and subscribes to changes for auto-save.
  // @see https://tanstack.com/query/v5/docs/framework/react/plugins/persistQueryClient
  void persistQueryClient({
    queryClient:
      queryClient as unknown as PersistQueryClientOptions['queryClient'],
    persister: queryPersister
  })

  return queryClient
}
```

**Important:** The `persister` option in `defaultOptions.queries` is for the experimental
`createPersister` API (per-query persistence). The stable approach uses `persistQueryClient()`
which persists the entire cache and handles restore/subscribe automatically.

**Step 3: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/trpc.ts
git commit -m "feat: add IndexedDB persistence and keepPreviousData to QueryClient"
```

---

## Phase 2: Theme Management (FOUC Prevention)

### Task 5: Add Inline Theme Script to HTML

**Files:**

- Modify: `index.html:1-14`

**Step 1: Add inline script before closing `</head>` tag**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VinylDeck</title>
    <!-- FOUC Prevention: Apply theme before React loads -->
    <script>
      try {
        const theme = localStorage.getItem('vinyldeck-theme') || 'system'
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
          .matches
          ? 'dark'
          : 'light'
        const effectiveTheme = theme === 'system' ? systemTheme : theme
        document.documentElement.classList.add(effectiveTheme)
      } catch (e) {
        // Ignore storage errors in private browsing
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 2: Test in browser**

```bash
bun dev
```

Open DevTools → Application → Local Storage → Check that theme class is applied to `<html>` before React loads

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add inline theme script to prevent FOUC"
```

---

### Task 6: Replace ThemeProvider with next-themes

**Files:**

- Modify: `src/providers/theme-provider.tsx:1-88`

**Step 1: Replace entire file content**

```typescript
// src/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

/**
 * Theme provider using next-themes.
 * Prevents FOUC (flash of unstyled content) and flickering during theme toggle.
 *
 * Benefits:
 * - No white flash on page load (inline script in index.html)
 * - No flickering on theme toggle (disableTransitionOnChange)
 * - Simpler implementation (~88 lines → ~15 lines)
 * - Battle-tested library (zero bundle impact, already installed)
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      storageKey="vinyldeck-theme"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Test theme toggle**

```bash
bun dev
```

Toggle theme Light → Dark → System and verify no flickering

**Step 4: Commit**

```bash
git add src/providers/theme-provider.tsx
git commit -m "feat: replace custom theme provider with next-themes"
```

---

### Task 7: Update ModeToggle Import

**Files:**

- Modify: `src/components/layout/mode-toggle.tsx:12`

**Step 1: Change useTheme import**

Find line 12:

```typescript
import { useTheme } from '@/hooks/use-theme'
```

Replace with:

```typescript
import { useTheme } from 'next-themes'
```

**Step 2: Remove `type Theme` import if present**

Remove this line if it exists (around line 13):

```typescript
import type { Theme } from '@/providers/theme-context'
```

**Step 3: Update `onValueChange` handler (around line 35)**

Find:

```typescript
onValueChange={(v) => setTheme(v as Theme)}
```

Replace with:

```typescript
onValueChange = { setTheme }
```

**Step 4: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 5: Test mode toggle**

```bash
bun dev
```

Click theme dropdown, select each option, verify it works

**Step 6: Commit**

```bash
git add src/components/layout/mode-toggle.tsx
git commit -m "refactor: use next-themes useTheme hook in mode toggle"
```

---

## Phase 3: Zustand Stores

### Task 8: Create Preferences Store

**Files:**

- Create: `src/stores/preferences-store.ts`

**Step 1: Create preferences store file**

```typescript
// src/stores/preferences-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ViewMode = 'grid' | 'table'
type AvatarSource = 'discogs' | 'gravatar'

interface PreferencesStore {
  // State
  viewMode: ViewMode
  avatarSource: AvatarSource
  gravatarEmail: string

  // Actions
  setViewMode: (mode: ViewMode) => void
  setAvatarSource: (source: AvatarSource) => void
  setGravatarEmail: (email: string) => void
}

/**
 * Zustand store for user preferences.
 * Automatically persists to localStorage under 'vinyldeck-prefs' key.
 *
 * Consolidates:
 * - vinyldeck_view_mode
 * - vinyldeck_avatar_source
 * - vinyldeck_gravatar_email
 */
export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      viewMode: 'grid',
      avatarSource: 'discogs',
      gravatarEmail: '',

      setViewMode: (mode) => set({ viewMode: mode }),
      setAvatarSource: (source) => set({ avatarSource: source }),
      setGravatarEmail: (email) => set({ gravatarEmail: email })
    }),
    { name: 'vinyldeck-prefs' }
  )
)
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/stores/preferences-store.ts
git commit -m "feat: add Zustand preferences store"
```

---

### Task 9: Update PreferencesProvider to Use Store

**Files:**

- Modify: `src/providers/preferences-provider.tsx:1-97`

**Step 1: Replace file content with store consumption**

```typescript
// src/providers/preferences-provider.tsx
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { buildGravatarUrl, normalizeGravatarEmail } from '@/lib/gravatar'
import { usePreferencesStore } from '@/stores/preferences-store'

import { PreferencesContext, type AvatarSource } from './preferences-context'

interface PreferencesProviderProps {
  children: ReactNode
}

/**
 * Preferences provider using Zustand store.
 * Provides React Context wrapper for Zustand store + Gravatar URL loading logic.
 */
export function PreferencesProvider({
  children,
}: PreferencesProviderProps): React.JSX.Element {
  // Subscribe to Zustand store
  const avatarSource = usePreferencesStore((state) => state.avatarSource)
  const gravatarEmail = usePreferencesStore((state) => state.gravatarEmail)
  const setAvatarSourceStore = usePreferencesStore(
    (state) => state.setAvatarSource
  )
  const setGravatarEmailStore = usePreferencesStore(
    (state) => state.setGravatarEmail
  )

  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null)

  // Load Gravatar URL when email changes
  useEffect(() => {
    const url = buildGravatarUrl(gravatarEmail, 128)
    if (!url) {
      return
    }

    let isActive = true
    const image = new Image()
    image.onload = () => {
      if (isActive) {
        setGravatarUrl(url)
      }
    }
    image.onerror = () => {
      if (isActive) {
        setGravatarUrl(null)
      }
    }
    image.src = url

    return () => {
      isActive = false
    }
  }, [gravatarEmail])

  const setAvatarSource = useCallback(
    (source: AvatarSource): void => {
      setAvatarSourceStore(source)
    },
    [setAvatarSourceStore]
  )

  const setGravatarEmail = useCallback(
    (email: string): void => {
      const normalized = normalizeGravatarEmail(email)
      setGravatarEmailStore(normalized)
      setGravatarUrl(null)
    },
    [setGravatarEmailStore]
  )

  const value = useMemo(
    () => ({
      avatarSource,
      gravatarEmail,
      gravatarUrl,
      setAvatarSource,
      setGravatarEmail,
    }),
    [avatarSource, gravatarEmail, gravatarUrl, setAvatarSource, setGravatarEmail]
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Test preferences**

```bash
bun dev
```

Toggle view mode Grid ↔ Table, check localStorage has `vinyldeck-prefs` key

**Step 4: Commit**

```bash
git add src/providers/preferences-provider.tsx
git commit -m "refactor: migrate preferences provider to use Zustand store"
```

---

### Task 10: Create Auth Store

**Files:**

- Create: `src/stores/auth-store.ts`

**Step 1: Create auth store file**

```typescript
// src/stores/auth-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthTokens {
  accessToken: string
  accessTokenSecret: string
}

interface AuthStore {
  // State
  tokens: AuthTokens | null
  sessionActive: boolean
  username: string | null
  userId: number | null

  // Actions
  setAuth: (tokens: AuthTokens, username: string, userId: number) => void
  setSessionActive: (active: boolean) => void
  signOut: () => void
  disconnect: () => void
}

/**
 * Zustand store for authentication state.
 * Automatically persists to localStorage under 'vinyldeck-auth' key.
 *
 * Consolidates:
 * - vinyldeck_oauth_token
 * - vinyldeck_oauth_token_secret
 * - vinyldeck_session_active
 * - vinyldeck_username
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
      username: null,
      userId: null,

      setAuth: (tokens, username, userId) =>
        set({ tokens, username, userId, sessionActive: true }),

      setSessionActive: (active) => set({ sessionActive: active }),

      // Sign out: clear session, keep tokens for "welcome back"
      signOut: () => set({ sessionActive: false }),

      // Disconnect: clear everything
      disconnect: () =>
        set({
          tokens: null,
          sessionActive: false,
          username: null,
          userId: null
        })
    }),
    { name: 'vinyldeck-auth' }
  )
)
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/stores/auth-store.ts
git commit -m "feat: add Zustand auth store"
```

---

### Task 11: Update AuthProvider to Use Store (Part 1 - Imports & State)

**Files:**

- Modify: `src/providers/auth-provider.tsx:1-263`

**Step 1: Update imports (lines 1-26)**

Replace the imports section with:

```typescript
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react'

import { usePreferences } from '@/hooks/use-preferences'
import { useAuthStore } from '@/stores/auth-store'
import { trpc } from '@/lib/trpc'
import { getStoredUserProfile, setStoredUserProfile } from '@/lib/storage'

import { AuthContext, type AuthState } from './auth-context'

interface AuthProviderProps {
  children: ReactNode
}
```

**Step 2: Update component state initialization (lines 33-43)**

Replace the state initialization with:

```typescript
export function AuthProvider({
  children,
}: AuthProviderProps): React.JSX.Element {
  const { gravatarEmail, setGravatarEmail } = usePreferences()
  const latestGravatarEmailRef = useRef(gravatarEmail)

  // Subscribe to Zustand auth store
  const authTokens = useAuthStore((state) => state.tokens)
  const sessionActive = useAuthStore((state) => state.sessionActive)
  const storedUsername = useAuthStore((state) => state.username)
  const storedUserId = useAuthStore((state) => state.userId)
  const setAuth = useAuthStore((state) => state.setAuth)
  const setSessionActive = useAuthStore((state) => state.setSessionActive)
  const signOutStore = useAuthStore((state) => state.signOut)
  const disconnectStore = useAuthStore((state) => state.disconnect)

  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userId: null,
    avatarUrl: null,
    oauthTokens: null,
  })

  // Get tRPC utils for direct client access
  const trpcUtils = trpc.useUtils()
```

**Step 3: Verify TypeScript compilation**

```bash
bun run build
```

Expected: May have errors in validateSession and other functions (we'll fix next)

**Step 4: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor(auth): update imports and state to use Zustand store"
```

---

### Task 12: Update AuthProvider to Use Store (Part 2 - validateSession)

**Files:**

- Modify: `src/providers/auth-provider.tsx:56-142`

**Step 1: Update validateSession function**

Find the `validateSession` callback (starts around line 56) and replace it with:

```typescript
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
      const identityResult = await trpcUtils.client.discogs.getIdentity.mutate({
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret
      })

      const { identity } = identityResult

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
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: Errors in useEffect initialization (we'll fix next)

**Step 3: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor(auth): update validateSession to use Zustand store"
```

---

### Task 13: Update AuthProvider to Use Store (Part 3 - Initialization)

**Files:**

- Modify: `src/providers/auth-provider.tsx:145-186`

**Step 1: Update initialization useEffect**

Find the initialization useEffect (starts around line 145) and replace it with:

```typescript
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
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No errors in initialization, errors remain in signOut/disconnect

**Step 3: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor(auth): update initialization to use Zustand store state"
```

---

### Task 14: Update AuthProvider to Use Store (Part 4 - Actions)

**Files:**

- Modify: `src/providers/auth-provider.tsx:194-263`

**Step 1: Update validateOAuthTokens callback**

Find validateOAuthTokens (around line 194) and replace with:

```typescript
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
```

**Step 2: Update signOut callback**

Find signOut (around line 212) and replace with:

```typescript
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
```

**Step 3: Update disconnect callback**

Find disconnect (around line 229) and replace with:

```typescript
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
```

**Step 4: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 5: Test auth flow**

```bash
bun dev
```

Test: Login → check localStorage has `vinyldeck-auth` → Sign out → check sessionActive=false → Refresh → see "Welcome back"

**Step 6: Commit**

```bash
git add src/providers/auth-provider.tsx
git commit -m "refactor(auth): update signOut and disconnect to use Zustand store"
```

---

### Task 15: Create Cross-Tab Sync

**Files:**

- Create: `src/lib/cross-tab-sync.ts`

**Step 1: Create cross-tab sync file**

```typescript
// src/lib/cross-tab-sync.ts
import { useAuthStore } from '@/stores/auth-store'

/**
 * Sets up cross-tab synchronization for auth state.
 * When auth is cleared in one tab, all other tabs receive the event and sync.
 *
 * Security: Prevents logged-out tabs from remaining authenticated.
 *
 * Call this once during app initialization.
 */
export function setupCrossTabSync() {
  if (typeof window === 'undefined') return

  window.addEventListener('storage', (event) => {
    // Zustand's persist middleware triggers storage events
    // when localStorage changes in OTHER tabs (not same tab)
    if (event.key === 'vinyldeck-auth') {
      // If auth was cleared in another tab
      if (event.newValue === null) {
        useAuthStore.getState().disconnect()
      }
      // If auth was updated in another tab, Zustand automatically syncs
      // the state via the persist middleware
    }
  })
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/lib/cross-tab-sync.ts
git commit -m "feat: add cross-tab auth synchronization"
```

---

### Task 16: Initialize Cross-Tab Sync in Main

**Files:**

- Modify: `src/main.tsx:1-38`

**Step 1: Add import**

Add this import after the other imports (around line 11):

```typescript
import { setupCrossTabSync } from '@/lib/cross-tab-sync'
```

**Step 2: Call setup before createRoot**

Add this line before `createRoot` (around line 25):

```typescript
// Setup cross-tab auth synchronization
setupCrossTabSync()

createRoot(document.getElementById('root')!).render(
```

**Step 3: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 4: Test cross-tab sync**

```bash
bun dev
```

Open two tabs → Login in Tab A → Sign out in Tab B → Check Tab A also logs out

**Step 5: Commit**

```bash
git add src/main.tsx
git commit -m "feat: initialize cross-tab auth sync on app startup"
```

---

## Phase 4: Collection Sync (Metadata-Based Change Detection)

### Task 17: Add getCollectionMetadata Procedure

**Files:**

- Modify: `src/server/trpc/routers/discogs.ts:48-180`

**Step 1: Add metadata procedure after getUserProfile**

Add this procedure at the end of the router, after `getUserProfile` (before the closing `})`):

```typescript
  /**
   * Get collection metadata for change detection.
   * Returns only the total count without fetching full collection data.
   * Fast endpoint (1 API call) for detecting new/deleted items.
   */
  getCollectionMetadata: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string(),
        username: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )

      try {
        // Fetch only first page with per_page=1 (minimal data transfer)
        const { data, rateLimit } = await client
          .user()
          .collection()
          .getReleases(input.username, 0, {
            page: 1,
            per_page: 1,
          })

        return {
          totalCount: data.pagination.items,
          rateLimit,
        }
      } catch (error) {
        handleDiscogsError(error, 'Failed to get collection metadata')
      }
    }),
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 3: Commit**

```bash
git add src/server/trpc/routers/discogs.ts
git commit -m "feat: add getCollectionMetadata tRPC procedure for change detection"
```

---

### Task 18: Create Collection Sync Hook

**Files:**

- Create: `src/hooks/use-collection-sync.ts`

**Step 1: Create collection sync hook file**

```typescript
// src/hooks/use-collection-sync.ts
import { trpc } from '@/lib/trpc'

/**
 * Detects changes in user's Discogs collection by comparing
 * cached data with live metadata.
 *
 * Runs fast metadata check (1 API call) on window focus to detect
 * new/deleted items without refetching expensive full collection.
 *
 * @returns Change detection state and counts
 */
export function useCollectionSync() {
  const utils = trpc.useUtils()

  // Fast metadata check (auto-refetches on window focus)
  const { data: meta } = trpc.discogs.getCollectionMetadata.useQuery(
    undefined,
    {
      refetchOnWindowFocus: true,
      staleTime: 30 * 1000 // Re-check every 30 seconds max
    }
  )

  // Get cached full collection data
  const cachedCollection = utils.discogs.getCollection.getData()

  // Calculate changes
  const cachedCount = cachedCollection?.pagination.items ?? 0
  const liveCount = meta?.totalCount ?? 0

  const hasChanges = cachedCount > 0 && liveCount !== cachedCount
  const newItemsCount = Math.max(0, liveCount - cachedCount)
  const deletedItemsCount = Math.max(0, cachedCount - liveCount)

  return {
    hasChanges,
    newItemsCount,
    deletedItemsCount,
    refreshCollection: () => utils.discogs.getCollection.invalidate()
  }
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: TypeScript errors about `getCollectionMetadata` not existing (tRPC types not regenerated yet - ignore for now)

**Step 3: Commit**

```bash
git add src/hooks/use-collection-sync.ts
git commit -m "feat: add collection sync hook for change detection"
```

---

### Task 19: Create Collection Sync Banner Component

**Files:**

- Create: `src/components/collection/collection-sync-banner.tsx`

**Step 1: Create sync banner component file**

```typescript
// src/components/collection/collection-sync-banner.tsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useCollectionSync } from '@/hooks/use-collection-sync'
import { trpc } from '@/lib/trpc'

/**
 * Persistent banner that notifies user of collection changes.
 * Shows until user clicks refresh button.
 *
 * How it works:
 * 1. User adds vinyl on Discogs website
 * 2. User opens VinylDeck → cached collection loads instantly
 * 3. Background metadata check detects count change
 * 4. Banner shows: "5 new items detected"
 * 5. User clicks refresh → full collection refetches
 * 6. Old data shown during refresh (no loading spinner)
 */
export function CollectionSyncBanner() {
  const { hasChanges, newItemsCount, deletedItemsCount, refreshCollection } =
    useCollectionSync()

  // Check if collection is currently refetching
  const { isFetching } = trpc.discogs.getCollection.useQuery(undefined, {
    enabled: false, // Don't trigger fetch, just observe state
  })

  if (!hasChanges && !isFetching) return null

  return (
    <Alert className="mb-4">
      {isFetching ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      <AlertDescription className="flex items-center justify-between">
        <span>
          {isFetching ? (
            'Refreshing collection...'
          ) : (
            <>
              {newItemsCount > 0 &&
                `${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} detected. `}
              {deletedItemsCount > 0 &&
                `${deletedItemsCount} item${deletedItemsCount > 1 ? 's' : ''} removed. `}
              Refresh to see changes.
            </>
          )}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshCollection}
          disabled={isFetching}
        >
          {isFetching ? 'Refreshing...' : 'Refresh Now'}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: TypeScript errors about tRPC types (will fix after restarting dev server)

**Step 3: Commit**

```bash
git add src/components/collection/collection-sync-banner.tsx
git commit -m "feat: add collection sync banner component"
```

---

### Task 20: Add Sync Banner to Collection Page

**Files:**

- Modify: `src/routes/_authenticated/collection.tsx:1-100`

**Step 1: Add import at top**

Add this import after the other component imports (around line 8):

```typescript
import { CollectionSyncBanner } from '@/components/collection/collection-sync-banner'
```

**Step 2: Add banner in render**

Find the return statement in `CollectionPage` function. Add the banner after the opening tag, before any existing content:

```typescript
function CollectionPage() {
  // ... existing state and hooks ...

  return (
    <>
      {/* Collection change detection banner */}
      <CollectionSyncBanner />

      {/* Rest of existing content */}
      <CollectionToolbar
```

**Step 3: Restart dev server to regenerate tRPC types**

```bash
# Stop current dev server (Ctrl+C)
bun dev
```

Wait for server to start, tRPC types should regenerate

**Step 4: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 5: Test sync banner**

```bash
bun dev
```

Banner should not show initially (no changes detected)

**Step 6: Commit**

```bash
git add src/routes/_authenticated/collection.tsx
git commit -m "feat: add collection sync banner to collection page"
```

---

## Phase 5: Security & Cleanup

### Task 21: Add CSP Headers to Vercel Config

**Files:**

- Modify: `vercel.json` (create if doesn't exist)

**Step 1: Create or update vercel.json**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https://i.discogs.com https://img.discogs.com https://www.gravatar.com https://secure.gravatar.com data: blob:; connect-src 'self' https://api.discogs.com https://*.vercel-insights.com; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

**Step 2: Test CSP locally**

```bash
vercel build
vercel dev
```

Open DevTools → Console → Check for CSP violations

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat: add CSP and security headers for XSS protection"
```

---

### Task 22: Delete Old Storage Implementation

**Files:**

- Delete: `src/lib/storage.ts`

**Step 1: Delete storage.ts**

```bash
rm src/lib/storage.ts
```

**Step 2: Fix import errors**

Build will fail with import errors. We need to update files that import from storage.ts:

**In `src/providers/auth-provider.tsx`:**

Remove these imports:

```typescript
import { getStoredUserProfile, setStoredUserProfile } from '@/lib/storage'
```

Add these imports instead:

```typescript
import {
  getStoredUserProfile,
  setStoredUserProfile
} from '@/lib/user-profile-cache'
```

**Step 3: Create temporary user profile cache file**

```typescript
// src/lib/user-profile-cache.ts
// Temporary: Will be replaced with TanStack Query cache in future
import type { DiscogsUserProfile } from '@/types/discogs'

export function getStoredUserProfile(): DiscogsUserProfile | null {
  try {
    const stored = localStorage.getItem('vinyldeck_user_profile')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function setStoredUserProfile(profile: DiscogsUserProfile): void {
  try {
    localStorage.setItem('vinyldeck_user_profile', JSON.stringify(profile))
  } catch {
    // Ignore storage errors
  }
}
```

**Step 4: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/user-profile-cache.ts src/providers/auth-provider.tsx
git commit -m "refactor: delete old storage.ts, create temporary user profile cache"
```

---

### Task 23: Delete Old View Preference Hook

**Files:**

- Delete: `src/hooks/use-view-preference.ts`

**Step 1: Delete use-view-preference.ts**

```bash
rm src/hooks/use-view-preference.ts
```

**Step 2: Update collection page import**

In `src/routes/_authenticated/collection.tsx`, find:

```typescript
import { useViewPreference } from '@/hooks/use-view-preference'
```

Replace with:

```typescript
import { usePreferencesStore } from '@/stores/preferences-store'
```

**Step 3: Update viewMode usage**

Find this line:

```typescript
const { viewMode, toggleView } = useViewPreference()
```

Replace with:

```typescript
const viewMode = usePreferencesStore((state) => state.viewMode)
const setViewMode = usePreferencesStore((state) => state.setViewMode)

const toggleView = () => {
  setViewMode(viewMode === 'grid' ? 'table' : 'grid')
}
```

**Step 4: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 5: Test view toggle**

```bash
bun dev
```

Toggle Grid ↔ Table view, verify it works

**Step 6: Commit**

```bash
git add src/hooks/use-view-preference.ts src/routes/_authenticated/collection.tsx
git commit -m "refactor: delete use-view-preference hook, use preferences store directly"
```

---

### Task 24: Delete Old Theme Files

**Files:**

- Delete: `src/providers/theme-context.ts`
- Delete: `src/hooks/use-theme.ts` (if exists)

**Step 1: Check if files exist and delete them**

```bash
# Check if theme-context exists
ls src/providers/theme-context.ts
# If exists:
rm src/providers/theme-context.ts

# Check if use-theme hook exists
ls src/hooks/use-theme.ts
# If exists:
rm src/hooks/use-theme.ts
```

**Step 2: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors (all imports already updated to next-themes)

**Step 3: Commit**

```bash
git add -u src/providers/theme-context.ts src/hooks/use-theme.ts
git commit -m "refactor: delete old theme context and hook files"
```

---

### Task 25: Remove Old Storage Keys from Constants

**Files:**

- Modify: `src/lib/constants.ts`

**Step 1: Find and remove STORAGE_KEYS and SESSION_STORAGE_KEYS**

Look for these exports in constants.ts and delete them:

```typescript
// DELETE these
export const STORAGE_KEYS = { ... }
export const SESSION_STORAGE_KEYS = { ... }
```

**Step 2: Verify no files import these constants**

```bash
grep -r "from '@/lib/constants'" src/ | grep -i storage
```

Expected: No matches (all storage key references should now use `@/lib/storage-keys`)

**Step 3: Verify TypeScript compilation**

```bash
bun run build
```

Expected: No TypeScript errors

**Step 4: Commit**

```bash
git add src/lib/constants.ts
git commit -m "refactor: remove old storage key constants"
```

---

## Phase 6: Testing & Verification

### Task 26: Comprehensive Testing

**Files:** None (manual testing)

**Step 1: Fresh install test**

```bash
# Clear all localStorage
# In DevTools Console:
localStorage.clear()
sessionStorage.clear()
# Refresh page
```

Expected: App works, shows login page

**Step 2: Login flow test**

```bash
bun dev
```

1. Click "Login with Discogs"
2. Authorize on Discogs
3. Redirect back to app
4. Check localStorage has exactly 3 keys: `vinyldeck-auth`, `vinyldeck-prefs`, `vinyldeck-theme`

**Step 3: Session persistence test**

1. Refresh page
2. Should stay logged in (no login redirect)

**Step 4: Sign out test**

1. Click sign out in sidebar
2. Check localStorage: `vinyldeck-auth` still exists but `sessionActive: false`
3. Refresh page
4. Should see "Welcome back" login UI

**Step 5: Disconnect test**

1. Go to Settings → Disconnect Discogs
2. Check localStorage: `vinyldeck-auth` should be deleted
3. Refresh page
4. Should see fresh login UI (not "Welcome back")

**Step 6: Cross-tab sync test**

1. Login in Tab A
2. Open Tab B (same URL)
3. Sign out in Tab B
4. Check Tab A also shows logged out

**Step 7: Theme toggle test**

1. Toggle Light → Dark → System
2. Verify no flickering, instant swap
3. Refresh page
4. Verify no white flash (FOUC)

**Step 8: Collection load test**

1. Navigate to Collection page
2. Should load instantly from cache (if you visited before)
3. Check DevTools → Application → IndexedDB → see TanStack Query cache

**Step 9: Build test**

```bash
bun run build
```

Expected: Build succeeds with no errors

**Step 10: Vercel build test**

```bash
vercel pull --yes
vercel build
```

Expected: Vercel build succeeds

**Step 11: CSP test**

```bash
vercel dev
```

Open DevTools → Console → Check for CSP violations

Expected: No CSP errors

**Step 12: Document test results**

Create checklist in terminal output:

```
✅ Fresh install works
✅ Login flow works
✅ Session persistence works
✅ Sign out works ("Welcome back" flow)
✅ Disconnect works (full logout)
✅ Cross-tab sync works
✅ Theme toggle works (no flicker/FOUC)
✅ Collection cache works
✅ Build succeeds
✅ Vercel build succeeds
✅ No CSP violations
```

---

### Task 27: Final Commit & Summary

**Files:** None

**Step 1: Verify localStorage structure**

Open DevTools → Application → Local Storage → Should have exactly 3 keys:

- `vinyldeck-auth`
- `vinyldeck-prefs`
- `vinyldeck-theme`

**Step 2: Verify IndexedDB**

Open DevTools → Application → IndexedDB → Should have:

- `keyval-store` (idb-keyval)
- TanStack Query cache entries

**Step 3: Create final summary commit**

```bash
git add -A
git commit -m "docs: verify storage consolidation complete

Summary of changes:
- Consolidated 11 localStorage keys → 3 keys
- Added Zustand stores for auth and preferences
- Added IndexedDB persistence for TanStack Query
- Migrated to next-themes (FOUC prevention)
- Added CSP headers for XSS protection
- Implemented cross-tab auth sync
- Added collection change detection with metadata endpoint

Result:
- ~283 lines of Context code removed
- +6KB bundle (Zustand + persist + idb-keyval)
- Better UX: instant loads, no flickering, background refresh
- Future-proof for aggregation (IndexedDB scales to 500+ items)"
```

---

## Success Criteria

**Before:**

- 11 localStorage keys (fragmented)
- 283 lines of Context boilerplate
- No cross-tab sync
- Stale API data in localStorage
- FOUC + theme flickering
- No CSP headers

**After:**

- 3 localStorage keys (consolidated)
- ~80 lines of store code
- Cross-tab auth sync
- 30-day API cache in IndexedDB
- No FOUC, no flickering
- CSP headers active

**Bundle Impact:**

- +6KB gzipped (Zustand + persist + idb-keyval)
- -283 lines of custom code

**User Experience:**

- ✅ Instant page loads (cached data)
- ✅ Background change detection
- ✅ Manual refresh control
- ✅ No loading spinners during refresh
- ✅ Smooth theme transitions
- ✅ Persistent across browser restarts

---

## Rollback Plan

If issues arise:

1. Revert to commit before Task 1: `git revert HEAD~27..HEAD`
2. Users may need to re-login (auth state structure changed)
3. Theme preference preserved (same key)
4. No data loss (old localStorage keys remain until manually cleared)

---

## Next Steps (Future Work)

1. **Move user profile to TanStack Query cache** - Replace `user-profile-cache.ts` with proper TanStack Query caching
2. **Add collection aggregation** - Backend only, frontend automatically adapts
3. **Test iOS PWA persistence** - Verify 7-day cache behavior on real devices
4. **Monitor bundle size** - Ensure +6KB doesn't impact performance metrics
5. **Add CSP reporting** - Set up CSP violation reporting endpoint

---

## References

- [Design Document](./2026-01-23-storage-state-management-redesign.md)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TanStack Query Persistence](https://tanstack.com/query/v5/docs/framework/react/plugins/persistQueryClient)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [CSP Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
