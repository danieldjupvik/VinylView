# Auth & Profile Storage Redesign with Offline Support

**Date:** 2026-01-25
**Status:** Draft

## Goals

1. **Clean up duplicate data** - Remove redundant `username`, `userId`, `cachedProfile` from Zustand auth store
2. **Reduce API calls** - Fetch profile only on login/reconnect, not every page load
3. **Add offline-first PWA support** - Browse collection without network access
4. **Add online/offline indicator** - Show status badge on user avatar
5. **Fix data leakage bug** - Clear IndexedDB on disconnect (currently not done)

## Design Principles

Following established best practices for React state management:

- **Server state** (profile, collection) → TanStack Query with IndexedDB persistence
- **Client state** (tokens, session flag) → Zustand with localStorage persistence
- **Ephemeral state** (online status) → React state (no persistence)

Sources:

- [TkDodo's Offline React Query](https://tkdodo.eu/blog/offline-react-query)
- [Federated State Done Right: Zustand + TanStack Query](https://dev.to/martinrojas/federated-state-done-right-zustand-tanstack-query-and-the-patterns-that-actually-work-27c0)
- [State Management in 2025](https://makersden.io/blog/react-state-management-in-2025)

## Known Limitations

- **navigator.onLine reliability**: `navigator.onLine` can report `true` when connected to WiFi but without internet access. The design handles this by treating failed `getIdentity` calls as authentication failures, which triggers disconnect. This is acceptable UX - user sees login page rather than broken state.

- **No migration for existing users**: Since the app is in development with no production users, no migration is provided. If this changes, a migration step would be needed to handle users who upgrade and go offline before their first login (they would have no cached profile).

---

## Storage Architecture

### Before

**`vinyldeck-auth` (localStorage via Zustand):**

```json
{
  "tokens": { "accessToken": "...", "accessTokenSecret": "..." },
  "sessionActive": true,
  "username": "daniel",
  "userId": 12345,
  "cachedProfile": {
    "id": 12345,
    "username": "daniel",
    "avatar_url": "...",
    "email": "..."
  }
}
```

**Problems:**

- `username` and `userId` duplicated (top-level AND inside `cachedProfile`)
- Profile fetched on every page load (unnecessary API calls)
- No offline support (validation fails without network)
- IndexedDB not cleared on disconnect (data leakage risk)

### After

**`vinyldeck-auth` (localStorage via Zustand):**

```json
{
  "tokens": { "accessToken": "...", "accessTokenSecret": "..." },
  "sessionActive": true
}
```

**`userProfile` query (IndexedDB via TanStack Query):**

```json
{
  "id": 12345,
  "username": "daniel",
  "avatar_url": "https://...",
  "email": "user@example.com"
}
```

**Benefits:**

- No duplication
- Profile cached alongside collection (consistent pattern)
- Works offline (both in IndexedDB)
- Clean separation: auth credentials vs user data

---

## API Call Behavior

### Before (every page load when online)

1. `getIdentity` - validate tokens
2. `getUserProfile` - fetch profile

**Result:** 2 API calls per page load

### After

**Regular page load (online):**

1. `getIdentity` - validate tokens only

**Login / "Continue" click / Reconnect:**

1. `getIdentity` - validate tokens
2. `getUserProfile` - fetch profile

**Offline:**

- Skip all API calls, trust cached state

**Result:** 1 API call per page load (50% reduction)

---

## Offline Behavior

| Scenario                            | `getIdentity` | `getUserProfile` | User Experience              |
| ----------------------------------- | ------------- | ---------------- | ---------------------------- |
| Page load (online, session active)  | ✓ Validate    | ✗ Use cache      | Normal browsing              |
| Page load (offline, session active) | ✗ Skip        | ✗ Use cache      | Offline browsing             |
| "Welcome back" page (offline)       | ✗ Skip        | ✗ Use cache      | Shows cached avatar/username |
| "Continue" click (offline)          | ✗ Skip        | ✗ Use cache      | Enters app immediately       |
| "Continue" click (online)           | ✓ Validate    | ✓ Refresh        | Validates then enters        |
| Coming back online                  | ✓ Validate    | ✗ Use cache      | Validates tokens only        |

---

## New Hooks

### `useOnlineStatus()`

```typescript
// src/hooks/use-online-status.ts
import { useEffect, useState } from 'react'

/**
 * Tracks browser online/offline status.
 * Uses navigator.onLine and listens to online/offline events.
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

### `useUserProfile()`

```typescript
// src/hooks/use-user-profile.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { trpc } from '@/lib/trpc'
import { useAuthStore } from '@/stores/auth-store'

export interface UserProfile {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

/**
 * Manages user profile data via TanStack Query.
 * Profile is persisted to IndexedDB for offline access.
 *
 * - No queryFn defined - data is set manually via fetchProfile()
 * - Call fetchProfile() on login/continue/reconnect
 * - Call clearProfile() on disconnect
 *
 * Note: We don't define a queryFn because profile should only be
 * fetched explicitly, not via refetch(). Data is set directly
 * using queryClient.setQueryData().
 */
export function useUserProfile() {
  const tokens = useAuthStore((state) => state.tokens)
  const queryClient = useQueryClient()
  const trpcUtils = trpc.useUtils()

  // Read-only query - data is set via setQueryData, not fetched
  const query = useQuery<UserProfile>({
    queryKey: ['userProfile'],
    enabled: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24 * 30 // 30 days
  })

  /**
   * Fetches profile from API and caches it.
   * Call after successful token validation.
   */
  const fetchProfile = async (username: string): Promise<UserProfile> => {
    if (!tokens) throw new Error('No tokens available')

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
  }

  /**
   * Clears profile from cache.
   * Called internally during disconnect.
   */
  const clearProfile = () => {
    queryClient.removeQueries({ queryKey: ['userProfile'] })
  }

  return {
    profile: query.data,
    isLoading: query.isLoading,
    fetchProfile,
    clearProfile
  }
}
```

---

## Updated Interfaces

### AuthStore (Zustand)

```typescript
// src/stores/auth-store.ts
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
```

### AuthContext

```typescript
// src/providers/auth-context.ts
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  isOnline: boolean
  hasStoredTokens: boolean
  oauthTokens: OAuthTokens | null
}

export interface AuthContextValue extends AuthState {
  validateOAuthTokens: (tokens?: OAuthTokens) => Promise<void>
  establishSession: (tokens?: OAuthTokens) => Promise<void>
  signOut: () => void
  disconnect: () => void
}
```

---

## Validation Flow

### AuthProvider Logic

```typescript
// Pseudocode for auth-provider.tsx

function AuthProvider({ children }) {
  const tokens = useAuthStore((state) => state.tokens)
  const sessionActive = useAuthStore((state) => state.sessionActive)
  const isOnline = useOnlineStatus()
  const { fetchProfile, clearProfile } = useUserProfile()
  const queryClient = useQueryClient()

  // Determine auth state on mount
  useEffect(() => {
    if (!tokens) {
      setIsAuthenticated(false)
      return
    }

    if (!sessionActive) {
      // Tokens exist but signed out - "Welcome back" state
      setIsAuthenticated(false)
      return
    }

    if (!isOnline) {
      // Offline with active session - trust cached state
      setIsAuthenticated(true)
      return
    }

    // Online with active session - validate tokens
    validateTokens()
  }, [tokens, sessionActive, isOnline])

  // Token validation only (no profile fetch)
  // Note: If navigator.onLine is wrong (reports online but no internet),
  // this will fail and trigger disconnect - acceptable UX as user sees login.
  async function validateTokens() {
    try {
      await trpc.discogs.getIdentity.query({
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret
      })
      setIsAuthenticated(true)
    } catch (error) {
      // Could be: invalid tokens, network error, or API error
      // All cases: clear auth and show login
      disconnect()
    }
  }

  // Full session establishment (validation + profile)
  async function establishSession() {
    const { identity } = await trpc.discogs.getIdentity.query({
      accessToken: tokens.accessToken,
      accessTokenSecret: tokens.accessTokenSecret
    })
    await fetchProfile(identity.username)
    setSessionActive(true)
    setIsAuthenticated(true)
  }

  // Disconnect clears everything including IndexedDB
  function disconnect() {
    disconnectStore()

    // Clear TanStack Query in-memory cache
    queryClient.clear()

    // IMPORTANT: queryClient.clear() only clears in-memory cache.
    // Must explicitly clear IndexedDB via the persister.
    void queryPersister.removeClient()

    // Clear browser caches (scoped to data caches only, not PWA precache)
    if ('caches' in window) {
      const cacheNames = [
        'discogs-api-cache',
        'discogs-images-cache',
        'gravatar-images-cache'
      ]
      cacheNames.forEach((name) => {
        caches.delete(name).catch(() => {})
      })
    }
  }
}
```

---

## Sign Out vs Disconnect

| Action         | Zustand Auth            | TanStack Query (IndexedDB)                              | Browser Caches    | Use Case                       |
| -------------- | ----------------------- | ------------------------------------------------------- | ----------------- | ------------------------------ |
| **Sign out**   | `sessionActive = false` | Keep all                                                | Keep all          | Temporary logout, quick return |
| **Disconnect** | Clear all               | `queryClient.clear()` + `queryPersister.removeClient()` | Clear data caches | Full logout, switch accounts   |

**Important:** `queryClient.clear()` only clears the in-memory cache. To properly clear IndexedDB, we must also call `queryPersister.removeClient()` which deletes the `vinyldeck-query-cache` key from IndexedDB.

---

## Online Status Indicator

### Avatar Component Update

Update to latest shadcn avatar which includes `AvatarBadge`.

**Verification steps** (to avoid breaking existing usage):

1. Back up current avatar component:

   ```bash
   cp src/components/ui/avatar.tsx src/components/ui/avatar.tsx.bak
   ```

2. Run the shadcn update:

   ```bash
   bunx shadcn@latest add avatar
   ```

3. Diff and verify changes:

   ```bash
   diff src/components/ui/avatar.tsx.bak src/components/ui/avatar.tsx
   ```

4. Check existing avatar usages still work (sidebar, settings, login page)

5. Remove backup after verification:
   ```bash
   rm src/components/ui/avatar.tsx.bak
   ```

### Usage in Sidebar

```tsx
// src/components/layout/sidebar-user.tsx
import { useOnlineStatus } from '@/hooks/use-online-status'
import { useUserProfile } from '@/hooks/use-user-profile'
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar'

function SidebarUser() {
  const isOnline = useOnlineStatus()
  const { profile } = useUserProfile()

  return (
    <Avatar className="h-8 w-8 rounded-lg">
      <AvatarImage src={profile?.avatar_url} alt={profile?.username} />
      <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
      <AvatarBadge
        className={isOnline ? 'bg-green-600 dark:bg-green-800' : 'bg-muted'}
      />
    </Avatar>
  )
}
```

---

## Files to Change

### Create New

| File                             | Purpose             |
| -------------------------------- | ------------------- |
| `src/hooks/use-online-status.ts` | Network status hook |
| `src/hooks/use-user-profile.ts`  | Profile data hook   |

### Modify

| File                                                   | Changes                                                                                                 |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `src/components/ui/avatar.tsx`                         | Update to latest shadcn (adds `AvatarBadge`)                                                            |
| `src/stores/auth-store.ts`                             | Remove `username`, `userId`, `cachedProfile`                                                            |
| `src/providers/auth-context.ts`                        | Update interface (remove profile fields, add `isOnline`, `hasStoredTokens`)                             |
| `src/providers/auth-provider.tsx`                      | Add offline-aware validation, add `queryClient.clear()` + `queryPersister.removeClient()` to disconnect |
| `src/hooks/use-collection.ts`                          | Get `username` from `useUserProfile()` instead of `useAuth()`                                           |
| `src/hooks/use-collection-sync.ts`                     | Get `username` from `useUserProfile()` instead of `useAuthStore`                                        |
| `src/components/layout/sidebar-user.tsx`               | Use `useUserProfile()`, add `AvatarBadge`                                                               |
| `src/components/collection/collection-sync-banner.tsx` | Get `username` from `useUserProfile()`                                                                  |
| `src/routes/login.tsx`                                 | Use `useAuth()` + `useUserProfile()`, fix disconnect to use shared function                             |
| `src/routes/oauth-callback.tsx`                        | Call `fetchProfile()` after OAuth success                                                               |
| `src/routes/_authenticated/settings.tsx`               | Use `useUserProfile()` for profile data                                                                 |

---

## Bug Fixes Included

### 1. IndexedDB not cleared on disconnect

**Before:** Disconnect only cleared Zustand and browser Cache API. TanStack Query cache (IndexedDB) was not cleared, risking data leakage between accounts.

**After:** Disconnect calls both:

- `queryClient.clear()` - clears in-memory cache
- `queryPersister.removeClient()` - explicitly clears IndexedDB

**Why both?** `queryClient.clear()` alone does NOT reliably clear persisted state. The persister syncs in-memory to IndexedDB, but clearing in-memory doesn't guarantee IndexedDB is cleared (race conditions, page unload, etc.). Explicitly calling `removeClient()` ensures IndexedDB is cleared.

### 2. Login page uses wrong disconnect

**Before:** Login page called `useAuthStore().disconnect` directly, bypassing shared disconnect logic.

**After:** Login page uses `disconnect` from `useAuth()` which includes all cleanup (Zustand, IndexedDB, browser caches).

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            App Startup                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │  Read from localStorage       │
                    │  (Zustand: tokens, session)   │
                    └───────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
            No tokens?                    Tokens exist?
                    │                               │
                    ▼                               ▼
            Show Login              ┌───────────────────────┐
                                    │  sessionActive=false? │
                                    └───────────────────────┘
                                            │
                            ┌───────────────┴───────────────┐
                            ▼                               ▼
                    Show "Welcome back"           sessionActive=true
                    (profile from IndexedDB)              │
                            │                             ▼
                            │                   ┌─────────────────┐
                            │                   │  Online check   │
                            │                   └─────────────────┘
                            │                           │
                            │               ┌───────────┴───────────┐
                            │               ▼                       ▼
                            │           Offline                  Online
                            │               │                       │
                            │               ▼                       ▼
                            │      Trust cache,            Validate tokens
                            │      enter app               (getIdentity)
                            │               │                       │
                            │               │               ┌───────┴───────┐
                            │               │               ▼               ▼
                            │               │           Success          Fail
                            │               │               │               │
                            │               │               ▼               ▼
                            │               │        Enter app         Disconnect,
                            │               │                          show Login
                            │               │
                            └───────────────┴───────────────┘
                                            │
                                            ▼
                                    ┌───────────────┐
                                    │  Collection   │
                                    │  (IndexedDB)  │
                                    └───────────────┘
```

---

## Testing Scenarios

### Offline Browsing

1. Log in while online
2. Browse collection (data cached)
3. Go offline (disable network)
4. Refresh page → should show cached collection with offline indicator

### Welcome Back Offline

1. Log in while online
2. Sign out (not disconnect)
3. Go offline
4. Open app → should show "Welcome back" with cached avatar
5. Click "Continue" → should enter app with cached data

### Account Switch

1. Log in as User A
2. Browse collection (cached)
3. Disconnect
4. Log in as User B
5. Verify: No User A data visible (IndexedDB cleared)

### Coming Back Online

1. Browse offline
2. Enable network
3. Verify: Tokens validated, no profile refetch, online indicator shows green

---

## Implementation Order

1. **Create new hooks** - `use-online-status.ts`, `use-user-profile.ts`
2. **Update avatar component** - Add `AvatarBadge` from latest shadcn
3. **Simplify auth store** - Remove profile fields from Zustand
4. **Update AuthProvider** - Add offline logic, fix disconnect
5. **Update AuthContext interface** - Add `isOnline`, `hasStoredTokens`
6. **Update consuming components** - Sidebar, settings, login, collection hooks
7. **Test all scenarios** - Offline, online, disconnect, sign out
