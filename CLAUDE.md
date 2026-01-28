This file provides guidance for automated agents and AI assistants when working with code in this repository.

## Build & Development Commands

- `bun dev` - Start development server with HMR
- `bun run build` - Type-check with TypeScript and build for production
- `bun run lint` - Run ESLint
- `bun run lint --fix` - Run ESLint and automatically fix issues
- `bun run preview` - Preview production build locally
- `bun run preview:offline` - Build and preview with local API server (for testing offline/PWA behavior)
- `vercel build` - Test Vercel build locally (requires `vercel pull --yes` first)

### Testing Vercel Builds Locally

Always run `vercel build` locally before pushing. The local `bun run build` uses different TypeScript settings than Vercel's Serverless Function compiler, so some errors only appear on Vercel.

```bash
vercel pull --yes  # First time setup
vercel build       # Test the full Vercel build
```

### Development Server

`bun dev` runs both Vite (port 5173) and a Hono-based API server (port 3001) concurrently. Vite proxies `/api` requests to the dev server. The dev server handles tRPC endpoints at `/api/trpc/*`.

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable                    | Side   | Required | Description                                 |
| --------------------------- | ------ | -------- | ------------------------------------------- |
| `DISCOGS_CONSUMER_SECRET`   | Server | Yes      | OAuth secret (never exposed to client)      |
| `VITE_DISCOGS_CONSUMER_KEY` | Client | Yes      | OAuth key (VITE\_ prefix exposes to client) |
| `ALLOWED_CALLBACK_ORIGINS`  | Server | No       | Comma-separated OAuth callback origins      |

Create separate Discogs apps for local dev and production at https://www.discogs.com/settings/developers.

## Branching Strategy: Trunk-Based Development

- **`main`** is the only long-lived branch
- Feature branches merge directly into `main` via **squash merge**
- Releases are automated via release-please

### Workflow

1. Create feature branch: `git checkout -b feat/my-feature`
2. Use Conventional Commits format
3. Open PR targeting `main` → CI runs automatically
4. **Squash merge** the PR
5. release-please creates/updates a release PR
6. **Squash merge** the release PR to trigger a release

### Deployment Strategy

| Deployment Type       | When             | Behavior               |
| --------------------- | ---------------- | ---------------------- |
| **Preview** (PRs)     | Every PR push    | ✓ Builds for reviewers |
| **Production** (main) | Feature merge    | ✗ Skipped              |
| **Production** (main) | Release PR merge | ✓ Builds and deploys   |

## Releases & Versioning

- Releases happen only from `main` via release-please
- **Beta phase:** tags like `v0.2.0-beta`
- Do not manually bump versions or edit `CHANGELOG.md`

### Commit Guide

**Format:** `<type>: <description>`

| Type     | Changelog Section | Version Bump  |
| -------- | ----------------- | ------------- |
| `feat:`  | Features          | Minor (0.X.0) |
| `fix:`   | Bug Fixes         | Patch (0.0.X) |
| `perf:`  | Performance       | Patch (0.0.X) |
| `feat!:` | Breaking Changes  | Major (X.0.0) |
| Others   | Hidden            | None          |

- **Do NOT include `Co-Authored-By:` trailers** in commit messages
- Write imperative: "add feature" not "Added feature"

### Squash Merge

When merging, replace GitHub's auto-generated commit list with just the PR title:

```text
feat: add collection search functionality
```

## Tech Stack

- **React 19** with React Compiler (babel-plugin-react-compiler)
- **Vite 7** for bundling and dev server
- **TypeScript 5.9** with strict configuration
- **Tailwind CSS 4** via @tailwindcss/vite plugin
- **shadcn/ui** (new-york style) for UI components
- **Bun** as the package manager
- **TanStack Router** for file-based routing
- **TanStack Query** for server state with IndexedDB persistence
- **Zustand** for client state with localStorage persistence
- **next-themes** for theme management (FOUC prevention)
- **tRPC** for type-safe API via Vercel Serverless Functions
- **i18next** for internationalization
- **PWA** via vite-plugin-pwa with offline-first support

## Project Structure

- `api/` - Vercel Serverless Functions (tRPC handler)
- `src/server/` - tRPC routers, Discogs client factory
- `src/components/ui/` - shadcn/ui components
- `src/components/layout/` - Sidebar, brand mark, toggles
- `src/components/collection/` - Collection view components
- `src/hooks/` - Custom hooks (auth, collection, preferences, online status, hydration, mobile detection, user profile)
- `src/lib/` - Utilities, constants, tRPC client, query persister, errors
- `src/providers/` - React providers (auth, theme, query/tRPC, hydration, i18n)
- `src/routes/` - TanStack Router file-based routes
- `src/stores/` - Zustand stores (auth-store, preferences-store)
- `src/types/` - TypeScript type definitions

## Path Aliases

Use `@/` to import from `src/`:

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

**Exception:** Server-side code in `api/` and `src/server/` - see Vercel Serverless Functions section.

## Adding shadcn Components

```bash
bunx shadcn add <component-name>
```

## Routing

Routes in `src/routes/` using TanStack Router's file-based routing:

- `__root.tsx` - Root layout with dark mode, toaster, 404 handler
- `index.tsx` - Redirects based on auth state
- `login.tsx` - Login page with Discogs OAuth flow
- `oauth-callback.tsx` - OAuth callback handler
- `_authenticated.tsx` - Auth guard layout
- `_authenticated/collection.tsx` - Collection page
- `_authenticated/settings.tsx` - Settings page

**View Transitions:** Use `viewTransition` prop on `<Link>` for smooth page transitions. Configured in `src/index.css` with fade animations that respect `prefers-reduced-motion`.

## Code Quality & Linting

### Code Formatting (Prettier)

- Single quotes, no semicolons, no trailing commas
- Tailwind classes auto-sorted via `prettier-plugin-tailwindcss`
- Husky pre-commit hooks run lint-staged

### ESLint Disable Directives

Always provide reasoning with `-- reason` syntax:

```typescript
// eslint-disable-next-line react/no-array-index-key -- Skeleton items have no stable ID
<VinylCardSkeleton key={`skeleton-${i}`} />
```

### Code Comments

Minimize comments - only add when code cannot convey the "why":

```typescript
// Good - explains non-obvious "why"
// Using indexOf instead of includes for IE11 compatibility
const hasItem = items.indexOf(item) !== -1
```

### TSDoc Documentation

**REQUIRED** - Add TSDoc to all exported functions, hooks, and utilities.

| Location                   | TSDoc Required                         |
| -------------------------- | -------------------------------------- |
| `src/hooks/**`             | Yes - all exported hooks               |
| `src/lib/**`               | Yes - all exported functions           |
| `src/providers/**`         | Yes - exported providers and functions |
| `src/stores/**`            | Yes - exported actions and selectors   |
| `src/components/ui/**`     | No - shadcn components (third-party)   |
| Internal/private functions | No - only if logic is non-obvious      |

**Required tags:**

- `@param` - For each parameter (include type context if not obvious)
- `@returns` - What the function returns (omit for void)
- `@throws` - If the function throws specific errors
- `@example` - For complex utilities (optional but helpful)

**Format:**

```typescript
/**
 * Brief description of what the function does.
 *
 * @param redirectUrl - The URL to validate
 * @param defaultPath - Default path if validation fails
 * @returns The sanitized URL or default path
 * @throws {OfflineNoCacheError} When offline with no cached data
 */
export function getSafeRedirectUrl(
  redirectUrl: string | null,
  defaultPath: string
): string { ... }
```

**Hook example:**

```typescript
/**
 * Tracks online/offline status with event listener cleanup.
 *
 * @returns Current online status from navigator.onLine
 */
export function useOnlineStatus(): boolean { ... }
```

## API Layer (tRPC)

All Discogs API calls go through tRPC serverless functions (OAuth 1.0a requires server-side signing).

```
Client (React) → tRPC Client → Vercel Serverless Function → Discogs API
```

**Available procedures:**

- `oauth.getRequestToken` / `oauth.getAccessToken` - OAuth flow
- `discogs.getIdentity` - Validate tokens, get user identity
- `discogs.getUserProfile` - Get user profile (avatar, email)
- `discogs.getCollection` - Get collection with pagination
- `discogs.getCollectionMetadata` - Fast count check for sync

**Rate Limiting:** `src/api/rate-limiter.ts` tracks Discogs API limits (60 req/min) using response headers. The limiter uses a moving window and prevents thundering herd with shared wait promises.

## Vercel Serverless Functions

**Import requirements for `api/` and `src/server/`:**

1. **Use `.js` extensions** on relative imports
2. **No `@/` path aliases** - use relative paths only

```typescript
// ✅ Correct
import { router } from './init.js'
import type { Foo } from '../../../types/foo.js'
```

The local `tsc -b` uses `moduleResolution: "bundler"`, so these errors only appear when running `vercel build`.

## Authentication

### Architecture Overview

Auth uses a layered architecture for offline-first support:

- **Zustand store** (`auth-store.ts`) - OAuth tokens + sessionActive flag (localStorage)
- **TanStack Query** (`useUserProfile`) - User profile (IndexedDB, survives offline)
- **AuthProvider** - Orchestrates validation, online/offline handling, cross-tab sync

### Optimistic Auth Flow

On page load with stored tokens + active session:

1. **Immediately authenticate** - No loading spinner, user sees app
2. **Background validation** - Validate tokens silently when online
3. **Only disconnect on 401/403** - Transient errors (5xx, network) don't logout

### Error Handling

| Error Type           | Examples             | Behavior                        |
| -------------------- | -------------------- | ------------------------------- |
| **Auth errors**      | 401, 403             | Disconnect user, clear caches   |
| **Transient errors** | 5xx, network timeout | Keep authenticated, retry later |

### Offline Support

When offline with stored tokens:

1. **With cached profile** → Authenticate using cached data
2. **Without cached profile** → Throws `OfflineNoCacheError` (`src/lib/errors.ts`), shows "Welcome back" flow (requires network to continue)

### Session Management (Two-tier)

| Action         | Effect                     | Next Login                          |
| -------------- | -------------------------- | ----------------------------------- |
| **Sign Out**   | Ends session, keeps tokens | "Welcome back" with Continue option |
| **Disconnect** | Clears everything          | Must re-authorize with Discogs      |

### Cross-Tab Sync

- Logout/disconnect in one tab propagates to all tabs
- Implemented via `useCrossTabAuthSync` hook reacting to Zustand storage events

### Post-Login Redirect

Original URL (including query params/hash) preserved via sessionStorage. Security: `isValidRedirectUrl()` blocks open redirect attacks.

## Offline-First PWA

### Service Worker

Configured in `vite.config.ts` via vite-plugin-pwa:

- **SPA navigation fallback** - `navigateFallback: 'index.html'` enables offline page refresh
- **API caching** - NetworkFirst strategy, 1-hour cache
- **Image caching** - CacheFirst strategy, 30-day cache

### Cache Management

Cache names defined in `src/lib/constants.ts` (`CACHE_NAMES`) for coordination between service worker and auth provider. On disconnect, auth provider clears:

- TanStack Query in-memory cache
- IndexedDB persisted cache
- Browser Cache API caches

### Query Caching Strategy

Default `staleTime: Infinity` in `query-provider.tsx`. Override per-query based on endpoint cost:

| Endpoint Type            | staleTime               | Refresh Trigger        | Example       |
| ------------------------ | ----------------------- | ---------------------- | ------------- |
| **Heavy** (aggregation)  | `Infinity` (default)    | Manual refresh button  | Collection    |
| **Auth-driven**          | `Infinity` (default)    | Login/logout events    | Profile       |
| **Light** (simple fetch) | `5 * 60 * 1000` (5 min) | Auto on stale + mount  | Wantlist      |
| **Polling**              | `30 * 1000` (30 sec)    | Window focus, interval | Metadata sync |

When adding new endpoints:

- Heavy/expensive → inherit default (no override needed)
- Light/cheap → add `staleTime: 1000 * 60 * 5` or similar

### Hydration Guard

`HydrationProvider` tracks when IndexedDB restoration completes. Use `useHydrationGuard` to prevent expensive queries from firing before cached data is restored.

**When to use `useHydrationGuard`:**

- Expensive queries with persisted results (e.g., collection fetching)
- Queries that would cause unnecessary network requests on hard reload

**When NOT to use it:**

- Lightweight metadata polls that are safe to run immediately
- Queries that don't have meaningful cached data

```typescript
// In use-collection.ts - gates collection fetch until hydration completes
const isQueryEnabled = useHydrationGuard(!!username && !!oauthTokens)

// Then use in useQuery:
const { data } = useQuery({
  queryKey: ['collection', ...],
  queryFn: fetchCollection,
  enabled: isQueryEnabled,  // Won't fire until IndexedDB hydration completes
})
```

**Why this matters:** Without the guard, a hard reload would immediately fire API requests even though the cached data is about to be restored from IndexedDB, causing redundant network traffic.

### Online Status

`useOnlineStatus()` hook tracks `navigator.onLine` and listens to online/offline events.

## State Management

### Zustand Stores (`src/stores/`)

- **auth-store.ts** - OAuth tokens, sessionActive flag
- **preferences-store.ts** - View mode, avatar source, Gravatar email

```typescript
const tokens = useAuthStore((state) => state.tokens)
const viewMode = usePreferencesStore((state) => state.viewMode)
```

### TanStack Query (IndexedDB)

- **User profile** - Via `useUserProfile` hook (persisted to IndexedDB)
- **Collection data** - Via `useCollection` hook

**Pattern for cache-subscribed queries:**

```typescript
// Subscribe to cache updates (including IndexedDB hydration) without auto-fetching
const { data } = useQuery({
  queryKey: USER_PROFILE_QUERY_KEY,
  queryFn: () => queryClient.getQueryData(USER_PROFILE_QUERY_KEY) ?? null,
  enabled: false, // Prevents automatic fetching
  staleTime: Infinity
})
```

### Storage Keys

**localStorage (`src/lib/storage-keys.ts`):**

| Key                  | Managed By  | Contents                              |
| -------------------- | ----------- | ------------------------------------- |
| `vinyldeck-auth`     | Zustand     | OAuth tokens, sessionActive           |
| `vinyldeck-prefs`    | Zustand     | viewMode, avatarSource, gravatarEmail |
| `vinyldeck-theme`    | next-themes | Theme preference                      |
| `vinyldeck-language` | i18next     | Language preference                   |

**sessionStorage:**

| Key                       | Purpose                       |
| ------------------------- | ----------------------------- |
| `vinyldeck-oauth-request` | Temporary OAuth request token |
| `vinyldeck-redirect`      | Post-login redirect URL       |

**IndexedDB:**

- TanStack Query cache (collection, user profile)
- Persists indefinitely (manual refresh philosophy)

## Collection Features

### URL State for Filters

Collection filters (genre, style, label, year range, etc.) are persisted in URL search params via `src/lib/url-state.ts`. This enables shareable filtered views and browser back/forward navigation.

### Collection Sync

Detects collection changes via fast metadata check (count only):

1. User adds vinyl on Discogs
2. VinylDeck loads cached collection instantly
3. Background metadata check detects count mismatch
4. Banner: "5 new items detected - Refresh"
5. User clicks refresh → background refetch with old data shown

## Theme Management

`next-themes` with FOUC prevention:

- `public/theme-init.js` applies theme before React loads
- No flickering on toggle (`disableTransitionOnChange`)
- System theme detection (`enableSystem`)

## Security

**CSP headers** in `vercel.json`:

- `script-src 'self'` - Only same-origin scripts
- `style-src 'self' 'unsafe-inline'` - Allows Tailwind
- `img-src` - Whitelists Discogs, Gravatar
- `frame-ancestors 'none'` - Prevents clickjacking

**Cross-tab auth sync** prevents stale authenticated sessions.

**Redirect validation** blocks open redirect attacks via protocol/path checks.
