# Storage & State Management Architecture Redesign

**Date:** 2026-01-23
**Status:** Approved
**Effort:** 8-11 hours
**Bundle Impact:** +6KB gzipped

## Problem Statement

Current localStorage implementation has scalability and maintenance issues:

- 11 fragmented localStorage keys with inconsistent naming
- Custom Context providers with ~283 lines of boilerplate
- No cross-tab synchronization for auth/preferences
- API cache stored in localStorage (causes stale data, doesn't scale for aggregation)
- FOUC (white flash) on theme toggle with cascading element updates
- No XSS protection (CSP not configured)

## Solution Overview

Consolidate to battle-tested tools:

- **Zustand** for client state (auth, preferences)
- **TanStack Query Persister** for server state (API cache)
- **next-themes** for theme management (FOUC prevention)
- **CSP headers** for XSS protection

**Result:** 3 localStorage keys, simpler code, better UX, future-proof for aggregation.

---

## 1. Storage Architecture

### Key Structure

```typescript
// src/lib/storage-keys.ts
export const STORAGE_KEYS = {
  AUTH: 'vinyldeck-auth', // Zustand: tokens, sessionActive, username, userId
  PREFERENCES: 'vinyldeck-prefs', // Zustand: viewMode, avatarSource, gravatarEmail
  THEME: 'vinyldeck-theme' // next-themes: theme preference
} as const

export const SESSION_KEYS = {
  OAUTH_REQUEST: 'vinyldeck-oauth-request', // OAuth temporary state
  REDIRECT_URL: 'vinyldeck-redirect' // Post-login redirect
} as const
```

### Consolidation Mapping

| Old Keys (11)                                                                                             | New Key                                     | Tool                       |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------- |
| `vinyldeck_oauth_token`, `vinyldeck_oauth_token_secret`, `vinyldeck_session_active`, `vinyldeck_username` | `vinyldeck-auth`                            | Zustand                    |
| `vinyldeck_view_mode`, `vinyldeck_avatar_source`, `vinyldeck_gravatar_email`                              | `vinyldeck-prefs`                           | Zustand                    |
| `vinyldeck-theme`                                                                                         | `vinyldeck-theme`                           | next-themes (no change)    |
| `vinyldeck_identity`, `vinyldeck_user_profile`                                                            | **Deleted** - moved to TanStack Query cache | TanStack Query + IndexedDB |

### Why Separate Stores?

- Auth is security-sensitive, preferences are not
- Different lifecycles (auth cleared on disconnect, prefs persist)
- Single-responsibility principle
- Easier to reason about and test

---

## 2. Zustand State Management

### Dependencies

```bash
bun add zustand
```

### Auth Store

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

### Preferences Store

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

### Benefits

- ~1KB bundle size (tiny)
- Built-in localStorage persistence
- TypeScript-friendly API
- Reduces Context boilerplate (~263 lines → ~80 lines for auth)

---

## 3. Cross-Tab Synchronization

**Critical for security:** Logout in one tab must log out all tabs.

```typescript
// src/lib/cross-tab-sync.ts
import { useAuthStore } from '@/stores/auth-store'

/**
 * Sets up cross-tab synchronization for auth state.
 * When auth is cleared in one tab, all other tabs receive the event and sync.
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

**Initialize in app entry:**

```typescript
// src/main.tsx
import { setupCrossTabSync } from '@/lib/cross-tab-sync'

setupCrossTabSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

---

## 4. TanStack Query Persistence (API Cache)

### Dependencies

```bash
bun add @tanstack/query-persist-client-core idb-keyval
```

### Query Persister Setup

```typescript
// src/lib/query-persister.ts
import { experimental_createPersister } from '@tanstack/query-persist-client-core'
import { get, set, del } from 'idb-keyval'

/**
 * Creates an IndexedDB persister for TanStack Query.
 * Uses per-query persistence for memory efficiency.
 */
export const queryPersister = experimental_createPersister({
  storage: {
    getItem: async (key) => await get(key),
    setItem: async (key, value) => await set(key, value),
    removeItem: async (key) => await del(key)
  },
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  serialize: (data) => data,
  deserialize: (data) => data
})
```

### Update QueryClient

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query'
import { QueryClient } from '@tanstack/react-query'
import { keepPreviousData } from '@tanstack/react-query'
import { queryPersister } from './query-persister'
import type { AppRouter } from '../server/trpc'

export const trpc = createTRPCReact<AppRouter>()

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      persister: queryPersister, // All queries persist to IndexedDB
      placeholderData: keepPreviousData // Show old data during refetch
    }
  }
})
```

### Why IndexedDB?

- **No 5MB limit** (critical for large collections with aggregation)
- **Per-query persistence** (memory efficient)
- **Async API** (non-blocking)
- **Future-proof** for 500+ item collections with 2-3 API calls per item

### Cache Lifecycle

- **Fresh data:** Served from cache instantly, no API call
- **Stale data (>5 min):** Served from cache, refetch in background
- **Expired data (>30 days):** Removed, fresh fetch required

---

## 5. Collection Change Detection (Metadata-Based)

**Goal:** Detect new/deleted items without refetching 20-minute aggregated collection.

### Backend: Metadata Endpoint

```typescript
// src/server/trpc/routers/discogs.ts
export const discogsRouter = router({
  // ... existing procedures

  /**
   * Fast metadata endpoint for change detection.
   * Returns collection count without fetching full data.
   */
  getCollectionMetadata: protectedProcedure.query(async ({ ctx }) => {
    const { username } = ctx.auth

    // Discogs collection endpoint with page=1, per_page=1 (minimal data)
    const response = await ctx.discogsClient.getCollection(username, {
      page: 1,
      per_page: 1
    })

    return {
      totalCount: response.pagination.items
    }
  })
})
```

### Frontend: Change Detection Hook

```typescript
// src/hooks/use-collection-sync.ts
import { trpc } from '@/lib/trpc'

/**
 * Detects changes in user's Discogs collection by comparing
 * cached data with live metadata.
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

### UI: Sync Banner

```typescript
// src/components/collection/collection-sync-banner.tsx
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2 } from 'lucide-react'
import { useCollectionSync } from '@/hooks/use-collection-sync'
import { trpc } from '@/lib/trpc'

/**
 * Persistent banner that notifies user of collection changes.
 * Shows until user clicks refresh.
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
              {newItemsCount > 0 && `${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} detected. `}
              {deletedItemsCount > 0 && `${deletedItemsCount} item${deletedItemsCount > 1 ? 's' : ''} removed. `}
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

### How It Works

1. User adds vinyl on Discogs website
2. User opens VinylDeck → cached collection loads instantly
3. Background metadata check (1 API call) detects count change
4. Persistent banner shows: "5 new items detected - Refresh to see changes"
5. User clicks refresh → 20-minute aggregation runs in background
6. Old collection stays visible during refresh (thanks to `placeholderData: keepPreviousData`)
7. After completion, new items appear

### Benefits

- ✅ Always instant initial load (from cache)
- ✅ Detects changes automatically (on window focus)
- ✅ User controls expensive refetch (manual button)
- ✅ No loading spinners (old data shown during refresh)
- ✅ Works with future aggregation without changes

---

## 6. Theme Management (FOUC Prevention)

### Current Problem

Current implementation causes flickering on theme toggle:

```typescript
// Problem code in theme-provider.tsx
useEffect(() => {
  root.classList.remove('light', 'dark') // ⚠️ Brief "no theme" state
  root.classList.add(theme) // ⚠️ CSS variables cascade one by one
}, [theme])
```

**Result:** Elements flash default colors then update one-by-one.

### Solution: next-themes

Already installed, just needs proper configuration.

#### Inline Script (FOUC Prevention)

```html
<!-- index.html - Add in <head> before </head> -->
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
```

#### Theme Provider

```typescript
// src/providers/theme-provider.tsx
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      storageKey="vinyldeck-theme"
      enableSystem
      disableTransitionOnChange  // Prevents flickering during theme switch
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
```

#### Mode Toggle (No Visual Changes)

```typescript
// src/components/layout/mode-toggle.tsx
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes' // Only change: import source
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

export function ModeToggle(): React.JSX.Element {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          title={t('theme.toggle', 'Toggle theme')}
          aria-label={t('theme.toggle', 'Toggle theme')}
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={setTheme}
        >
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            {t('theme.light', 'Light')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            {t('theme.dark', 'Dark')}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            {t('theme.system', 'System')}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### How It Works

1. **Inline script runs first** (before React, before CSS)
   - Reads `vinyldeck-theme` from localStorage
   - Applies `class="dark"` or `class="light"` to `<html>`
   - No flash because theme applied before content renders

2. **React hydrates** with next-themes
   - Takes over theme management
   - Syncs with inline script (same storage key)
   - `disableTransitionOnChange` prevents cascading updates

3. **Theme toggle is atomic**
   - Classes swap instantly
   - CSS transitions disabled during swap
   - No "one by one" element updates

### Benefits

- ✅ No FOUC on initial page load
- ✅ No flickering on theme toggle
- ✅ Simpler code (~88 lines → ~15 lines)
- ✅ Zero bundle impact (already installed)

---

## 7. Security: Content Security Policy (CSP)

**Why needed:** localStorage tokens are vulnerable to XSS attacks. CSP blocks XSS at the browser level.

### Vercel Configuration

```json
// vercel.json
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

### CSP Directives Explained

| Directive                          | Value                                | Purpose                              |
| ---------------------------------- | ------------------------------------ | ------------------------------------ |
| `default-src 'self'`               | Only same origin                     | Blocks external resources by default |
| `script-src 'self'`                | Only same-origin scripts             | **Prevents XSS script injection**    |
| `style-src 'self' 'unsafe-inline'` | Same-origin + inline                 | Allows Tailwind/shadcn inline styles |
| `img-src`                          | Self + Discogs + Gravatar            | Album covers, user avatars           |
| `connect-src`                      | Self + Discogs API + Vercel Insights | API calls, analytics                 |
| `font-src 'self'`                  | Same-origin fonts                    | Local fonts only                     |
| `frame-ancestors 'none'`           | Cannot be iframed                    | Prevents clickjacking                |
| `base-uri 'self'`                  | Base tag restrictions                | Prevents base tag injection          |
| `form-action 'self'`               | Forms submit same-origin             | Prevents CSRF via forms              |

### Why `'unsafe-inline'` for styles?

Tailwind CSS and shadcn use inline styles extensively. Removing this would require:

- CSS-in-JS with nonces (complex)
- Extract all styles to external files (breaks Tailwind utility-first)

**Risk:** Low - CSS injection can't execute JavaScript.

### Testing

```bash
# Local
bun dev

# Vercel preview
vercel build
vercel dev
```

Check DevTools Console for CSP violations.

### Security Impact

**With CSP:**

- ✅ XSS attacks blocked at browser level
- ✅ localStorage tokens protected from script injection
- ✅ No external scripts can run
- ✅ Defense-in-depth security

**Without CSP:**

- ❌ XSS can steal localStorage tokens
- ❌ Malicious scripts can run if injected
- ❌ Relying only on input sanitization

---

## Implementation Plan

### Phase 1: Foundations (2-3 hours)

1. Create `src/lib/storage-keys.ts`
2. Create `src/lib/query-persister.ts`
3. Update `src/lib/trpc.ts` with persister + `placeholderData`
4. Add inline script to `index.html`
5. Replace `src/providers/theme-provider.tsx` with next-themes
6. Update `src/components/layout/mode-toggle.tsx` import

### Phase 2: State Management (3-4 hours)

7. Create `src/stores/preferences-store.ts`
8. Update `src/providers/preferences-provider.tsx` to consume store
9. Create `src/stores/auth-store.ts`
10. Update `src/providers/auth-provider.tsx` to consume store
11. Create `src/lib/cross-tab-sync.ts`
12. Call `setupCrossTabSync()` in `src/main.tsx`

### Phase 3: Collection Sync (2-3 hours)

13. Add `getCollectionMetadata` procedure to `src/server/trpc/routers/discogs.ts`
14. Create `src/hooks/use-collection-sync.ts`
15. Create `src/components/collection/collection-sync-banner.tsx`
16. Add `<CollectionSyncBanner />` to collection page

### Phase 4: Security & Cleanup (1 hour)

17. Add CSP headers to `vercel.json`
18. Delete `src/lib/storage.ts`
19. Delete `src/hooks/use-view-preference.ts`
20. Delete `src/providers/theme-context.ts`
21. Delete `src/hooks/use-theme.ts` (if exists)
22. Test: Login, logout, theme switch, collection load
23. Verify localStorage has only 3 keys

**Total: 8-11 hours**

---

## Files to Create

```
src/stores/auth-store.ts
src/stores/preferences-store.ts
src/lib/storage-keys.ts
src/lib/query-persister.ts
src/lib/cross-tab-sync.ts
src/hooks/use-collection-sync.ts
src/components/collection/collection-sync-banner.tsx
```

## Files to Modify

```
src/lib/trpc.ts                              - Add persister + placeholderData
src/lib/constants.ts                         - Remove STORAGE_KEYS
src/main.tsx                                 - Add setupCrossTabSync()
src/providers/theme-provider.tsx             - Replace with next-themes
src/providers/auth-provider.tsx              - Consume auth store
src/providers/preferences-provider.tsx       - Consume preferences store
src/components/layout/mode-toggle.tsx        - Import from next-themes
src/hooks/use-auth.ts                        - Export from auth-store
src/hooks/use-preferences.ts                 - Export from preferences-store
src/server/trpc/routers/discogs.ts           - Add getCollectionMetadata
src/routes/_authenticated/collection.tsx     - Add sync banner
index.html                                   - Add inline theme script
vercel.json                                  - Add CSP headers
```

## Files to Delete

```
src/lib/storage.ts
src/hooks/use-view-preference.ts
src/providers/theme-context.ts
src/hooks/use-theme.ts (if exists)
```

---

## Migration & Data Preservation

**No data migration needed** - this is a development app with no production users.

**For future reference:**

- Zustand persist middleware reads existing localStorage keys
- Users won't lose login/settings on deploy (same storage keys)
- Old unused keys will naturally become stale

---

## Future: Aggregation Compatibility

**This architecture is future-proof:**

### What Changes (Backend Only)

```typescript
// BEFORE (current)
getCollection: protectedProcedure.query(async ({ ctx }) => {
  return await discogsClient.getCollection(username)
})

// AFTER (with aggregation)
getCollection: protectedProcedure.query(async ({ ctx }) => {
  const collection = await discogsClient.getCollection(username)

  // Add aggregation (2-3 API calls per item)
  const enriched = await Promise.all(
    collection.releases.map(async (release) => {
      const masterRelease = await discogsClient.getMasterRelease(release.id)
      const marketplace = await discogsClient.getMarketplace(release.id)
      return { ...release, masterRelease, marketplace }
    })
  )

  return { ...collection, releases: enriched }
})
```

### What Doesn't Change (Frontend)

- Zero frontend changes
- TanStack Query cache adapts automatically
- IndexedDB persister handles larger data
- Metadata check still works (count unchanged)
- 30-day cache prevents re-waiting on aggregation
- Sync banner still works

**Just add aggregation logic to backend and it works!**

---

## Success Metrics

### Before

- **11 localStorage keys** (fragmented)
- **283 lines** of Context boilerplate
- **No cross-tab sync** (security risk)
- **Stale API data** in localStorage (2-month-old profiles)
- **FOUC + theme flickering** on toggle
- **No XSS protection** (no CSP)

### After

- **3 localStorage keys** (consolidated)
- **~80 lines** of store code (simpler)
- **Cross-tab sync** for auth/preferences
- **30-day API cache** in IndexedDB (auto-invalidation)
- **No FOUC, no flickering** (instant theme swap)
- **CSP headers** (XSS blocked at browser level)

### Bundle Impact

- **+6KB gzipped** (Zustand + persist + IndexedDB persister)
- **-283 lines** of custom code removed

### User Experience

- ✅ Instant page loads (cached data)
- ✅ Background change detection (auto-checks on focus)
- ✅ Manual refresh control (user decides when to wait)
- ✅ No loading spinners during refresh (old data shown)
- ✅ Smooth theme transitions (no flicker)
- ✅ Persistent across browser restarts
- ✅ Works on iOS PWA (within 7-day limit, same as before)

---

## Risk Assessment

### Low Risk

- Theme replacement (next-themes is battle-tested)
- TanStack Query persistence (widely used, stable API)
- CSP headers (can adjust if issues arise)

### Medium Risk

- Auth state migration to Zustand (requires OAuth flow testing)
- Cross-tab sync (needs multi-tab manual testing)

### High Risk

- None - all tools are production-ready and widely adopted

### Rollback Plan

If issues arise:

1. Revert to previous commit (no data loss - same storage keys)
2. Users may need to re-login (auth state structure changed)
3. Theme preference preserved (same key)

---

## Testing Checklist

- [ ] Fresh install: App works with empty localStorage
- [ ] Login flow: OAuth completes successfully
- [ ] Session persistence: Refresh page, still logged in
- [ ] Sign out: Session clears, tokens persist for "welcome back"
- [ ] Disconnect: All auth data cleared
- [ ] Cross-tab sync: Logout in Tab A, Tab B also logs out
- [ ] Theme toggle: No FOUC, no flickering, instant swap
- [ ] Collection load: Instant from cache, background refetch works
- [ ] New items: Banner shows when Discogs collection updated
- [ ] Manual refresh: Old data shown during 20-minute aggregation
- [ ] DevTools: Only 3 localStorage keys present
- [ ] DevTools: No CSP violations in console
- [ ] Build: `vercel build` succeeds
- [ ] Mobile: PWA installs and works on iOS

---

## References

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [TanStack Query Persistence](https://tanstack.com/query/v5/docs/framework/react/plugins/persistQueryClient)
- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [CSP Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OAuth 1.0a Storage Security](https://www.discogs.com/developers/)
