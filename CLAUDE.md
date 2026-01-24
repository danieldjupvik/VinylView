This file provides guidance for automated agents and AI assistants when working with code in this repository.

## Build & Development Commands

- `bun dev` - Start development server with HMR
- `bun run build` - Type-check with TypeScript and build for production
- `bun run lint` - Run ESLint
- `bun run lint --fix` - Run ESLint and automatically fix issues
- `bun run preview` - Preview production build locally
- `vercel build` - Test Vercel build locally (requires `vercel pull --yes` first)

### Testing Vercel Builds Locally

Always run `vercel build` locally before pushing to catch Vercel-specific build errors. The local `bun run build` uses different TypeScript settings than Vercel's Serverless Function compiler, so some errors only appear on Vercel.

```bash
# First time setup (pulls project settings)
vercel pull --yes

# Test the full Vercel build
vercel build
```

## Branching Strategy: Trunk-Based Development

This project uses **Trunk-Based Development** with a single `main` branch:

- **`main`** is the only long-lived branch
- Feature branches are short-lived and merge directly into `main`
- No `develop` or `release/*` branches
- Releases are automated via release-please

### Workflow

1. Create a feature branch from `main`: `git checkout -b feat/my-feature`
2. Make commits using Conventional Commits format
3. Open a PR targeting `main`
4. CI runs lint and build checks automatically
5. **Squash merge** the PR into `main`
6. release-please automatically creates/updates a release PR
7. When ready to release, **squash merge** the release-please PR

**Use squash merge for ALL PRs** (both feature PRs and release-please PRs). This is [recommended by release-please](https://github.com/googleapis/release-please) for a clean, linear git history.

### How Release-Please Works

- On every push to `main`, release-please creates or updates a "Release PR"
- The Release PR accumulates ALL changes since the last release
- Example: Merge 3 feature PRs → release-please updates the same Release PR with all 3
- Merging the Release PR triggers:
  - Version bump in `package.json`
  - `CHANGELOG.md` update
  - Git tag creation (e.g., `v0.2.0-beta`)
  - GitHub Release creation

### Deployment Strategy

Controlled by `scripts/vercel-ignore-build.sh` and `vercel.json`:

| Deployment Type       | When             | Behavior                             |
| --------------------- | ---------------- | ------------------------------------ |
| **Preview** (PRs)     | Every PR push    | ✓ Always builds - reviewers can test |
| **Production** (main) | Feature merge    | ✗ Skipped - no deploy                |
| **Production** (main) | Release PR merge | ✓ Builds and deploys                 |

This ensures production only updates on actual releases, while PRs still get preview URLs for testing.

## Releases & Versioning

This project uses release-please and GitHub releases for versioning:

- **Releases happen only from `main`** via release-please
- **Beta phase:** releases are marked as GitHub pre-releases (tags like `v0.2.0-beta`)
- CI runs lint and build checks on PRs and pushes to `main`
- Do not manually bump versions or edit `CHANGELOG.md` for release entries; release-please does it
- `CHANGELOG.md` remains the canonical changelog and can be rendered in the app

### Commit Guide (for clean changelogs)

Use Conventional Commits so release-please generates clear changelog entries. The commit message becomes the changelog entry, so write it for users.

**Format:** `<type>: <description>`

**How release-please categorizes commits:**

| Type                           | Changelog Section            | Version Bump  | Example                      |
| ------------------------------ | ---------------------------- | ------------- | ---------------------------- |
| `feat:`                        | **Features**                 | Minor (0.X.0) | `feat: add dark mode toggle` |
| `fix:`                         | **Bug Fixes**                | Patch (0.0.X) | `fix: prevent double submit` |
| `feat!:` or `BREAKING CHANGE:` | **⚠ BREAKING CHANGES**       | Major (X.0.0) | `feat!: redesign auth flow`  |
| `docs:`                        | Hidden                       | None          | `docs: update README`        |
| `chore:`                       | Hidden                       | None          | `chore: update dependencies` |
| `refactor:`                    | Hidden                       | None          | `refactor: simplify utils`   |
| `test:`                        | Hidden                       | None          | `test: add unit tests`       |
| `ci:`                          | Hidden                       | None          | `ci: fix workflow`           |
| `style:`                       | Hidden                       | None          | `style: format code`         |
| `perf:`                        | **Performance Improvements** | Patch (0.0.X) | `perf: optimize rendering`   |

**Key points:**

- Only `feat`, `fix`, `perf`, and breaking changes appear in the public changelog
- Hidden types still trigger release-please to update the PR, but won't add changelog entries
- Use `feat` and `fix` for user-facing changes you want documented
- Use `chore`, `docs`, `refactor`, etc. for internal work that users don't need to know about
- **Do NOT include `Co-Authored-By:` trailers in commit messages** - keep commits clean without attribution metadata

**Good examples (user-facing, imperative):**

```text
feat: add grid/table toggle for collection view
feat: support filtering by release year
feat: add keyboard navigation to vinyl cards
fix: prevent duplicate API calls on rapid pagination
fix: handle empty collection state gracefully
fix: correct genre display for multi-genre releases
```

**Bad examples (avoid these):**

```text
feat: Added the thing          # Past tense, vague
fix: Fix bug                   # Redundant "fix", no description
feat: Implement feature X.     # Period at end, verbose
update stuff                   # No type prefix, vague
```

**With scope (optional, for larger codebases):**

```text
feat(auth): add session timeout warning
fix(api): handle rate limit errors gracefully
```

### Squash Merge Workflow (Step-by-Step)

Release-please reads commit messages on `main` to build the changelog. Follow this workflow:

**1. Name your PR with a Conventional Commit title:**

```text
feat: add collection search functionality
fix: resolve pagination reset on filter change
chore: update TypeScript to 5.9
```

**2. When merging on GitHub:**

- Click "Squash and merge" (not "Create a merge commit" or "Rebase and merge")
- GitHub shows a commit message dialog
- **DO NOT use the auto-generated message** (it lists all commits, which is noisy)
- The first line should already be your PR title - keep it as-is
- Optionally add a blank line and brief body, but the title is what matters

**3. Example of what GitHub shows:**

```text
feat: add collection search functionality

* WIP: search input
* add debounce
* fix styling
* address PR feedback
```

**Change it to just:**

```text
feat: add collection search functionality
```

**Why this matters:**

- The **first line** of the squash commit becomes the changelog entry
- Auto-generated messages create cluttered changelogs with WIP commits
- One clean line = one clean changelog entry

**Why squash merge (not merge commit or rebase)?**

| Strategy           | Result                     | Changelog Impact                |
| ------------------ | -------------------------- | ------------------------------- |
| **Squash merge** ✓ | One commit per PR          | Clean: one entry per feature    |
| Merge commit       | All commits + merge commit | Noisy: WIP commits in changelog |
| Rebase and merge   | All commits (rebased)      | Noisy: WIP commits in changelog |

Squash merge is the only strategy that gives you full control over the changelog entry.

## Tech Stack

- **React 19** with React Compiler enabled (via babel-plugin-react-compiler)
- **Vite 7** for bundling and dev server
- **TypeScript 5.9** with strict configuration
- **Tailwind CSS 4** via @tailwindcss/vite plugin
- **shadcn/ui** (new-york style) for UI components
- **Bun** as the package manager
- **TanStack Router** for file-based routing
- **TanStack Query** for server state management with IndexedDB persistence
- **Zustand** for client state (auth, preferences) with localStorage persistence
- **next-themes** for theme management (FOUC prevention)
- **tRPC** for type-safe API calls via Vercel Serverless Functions
- **i18next** for internationalization
- **country-flag-icons** for lightweight flag icons
- **PWA** via vite-plugin-pwa

## Project Structure

- `api/` - Vercel Serverless Functions (tRPC handler)
- `src/server/` - Server-side code (tRPC routers, Discogs client factory)
- `src/api/` - Client-side API helpers and rate limiter utilities
- `src/components/ui/` - shadcn/ui components (added via `bunx shadcn add <component>`)
- `src/components/layout/` - Layout components (sidebar, brand mark, toggles)
- `src/components/collection/` - Collection view components (including sync banner)
- `src/components/auth/` - Authentication components
- `src/hooks/` - Custom React hooks (auth, collection, preferences, collection sync)
- `src/lib/` - Utility functions, constants, storage keys, tRPC client, query persister
- `src/locales/` - i18n translation files
- `src/providers/` - React context providers (auth, theme, preferences, query/tRPC, i18n)
- `src/routes/` - TanStack Router file-based routes
- `src/stores/` - Zustand stores (auth-store, preferences-store)
- `src/types/` - TypeScript type definitions

## Path Aliases

Use `@/` to import from `src/`:

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

**Exception: Server-side code** - See "Vercel Serverless Functions" section below for import requirements in `api/` and `src/server/`.

## Adding shadcn Components

```bash
bunx shadcn add <component-name>
```

Components are placed in `src/components/ui/` and use the new-york style with lucide icons.

## Routing

Routes are defined in `src/routes/` using TanStack Router's file-based routing:

- `__root.tsx` - Root layout with dark mode, toaster, and 404 handler
- `index.tsx` - Redirects to `/collection` if authenticated, `/login` if not
- `login.tsx` - Login page with Discogs OAuth flow
- `oauth-callback.tsx` - OAuth callback handler (processes verifier from Discogs)
- `_authenticated.tsx` - Layout route with auth guard, redirects to `/login` if not authenticated
- `_authenticated/collection.tsx` - Collection page (full implementation)
- `_authenticated/settings.tsx` - Settings page with app version

## Code Quality & Linting

### ESLint Disable Directives

When disabling ESLint rules inline, **always provide a clear reasoning comment** explaining why the rule is being disabled. Use the `-- reason` syntax:

**Format:**

```typescript
// eslint-disable-next-line rule-name -- Clear explanation of why this is safe/necessary
```

**Good examples:**

```typescript
// eslint-disable-next-line react/no-array-index-key -- Skeleton items have no stable ID; index is safe for static placeholder list
<VinylCardSkeleton key={`skeleton-${i}`} />

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party library callback has untyped parameters
const handler = (data: any) => processLegacyData(data)

// eslint-disable-next-line react-hooks/exhaustive-deps -- Only run on mount, intentionally ignoring dependency
useEffect(() => { initialize() }, [])
```

**Bad examples:**

```typescript
// eslint-disable-next-line react/no-array-index-key
<VinylCardSkeleton key={`skeleton-${i}`} />  // No reasoning provided

// TODO: fix this later
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const data: any = response  // Vague reasoning

// eslint-disable-next-line  // No rule specified, disables all rules!
```

**Guidelines:**

- Explain **why** the code is safe despite triggering the rule
- Explain **why** the rule cannot be satisfied through refactoring
- Be specific about the context (e.g., "static placeholder list", "third-party API contract")
- Avoid vague reasons like "needed", "fix later", or "doesn't work otherwise"
- Use inline disables (`eslint-disable-next-line`) instead of file-level disables when possible
- Consider if the code can be refactored to avoid needing the disable directive

### Code Comments

**Minimize comments** - well-written code should be self-explanatory. Only add comments when they provide value that the code itself cannot convey.

**When to add comments:**

- Complex algorithms or business logic that isn't immediately obvious
- Non-obvious "why" explanations (e.g., workarounds, edge cases, security considerations)
- Important warnings or caveats that future developers need to know
- Regex patterns or complex expressions that benefit from explanation

**When NOT to add comments:**

- Describing what code does when it's already clear from reading it
- Restating variable/function names in prose
- Adding TODO comments without actionable context
- Commenting every function or block "just to have documentation"

**Examples:**

```typescript
// Bad - obvious from the code
// Loop through users and filter active ones
const activeUsers = users.filter(user => user.isActive)

// Bad - restates the function name
// Gets the user by ID
function getUserById(id: string) { ... }

// Good - explains non-obvious "why"
// Using indexOf instead of includes for IE11 compatibility
const hasItem = items.indexOf(item) !== -1

// Good - explains complex logic
// Bitwise OR with 0 truncates to 32-bit integer (faster than Math.floor for positive numbers)
const index = (position / cellSize) | 0
```

### TSDoc Documentation Standards

Use **TSDoc** format for all function and utility documentation. TSDoc is the standard for TypeScript documentation comments and provides consistent, parseable documentation.

**Apply TSDoc everywhere it makes sense** - exported functions, classes, types, complex utilities, and any code that benefits from clear documentation. Good documentation improves code quality and maintainability.

**Format:**

```typescript
/**
 * Brief one-line description of what the function does.
 *
 * Optional longer description with more details about behavior,
 * edge cases, or important implementation notes.
 *
 * @param paramName - Description of what this parameter is for
 * @param anotherParam - Description of another parameter
 * @returns Description of what the function returns
 */
export function myFunction(paramName: string, anotherParam: number): boolean {
  // implementation
}
```

**Good examples:**

```typescript
/**
 * Validates and sanitizes a redirect URL to prevent open redirect attacks.
 * Only allows internal paths (relative URLs starting with /).
 *
 * @param redirectUrl - The URL to validate
 * @param defaultPath - The default path to return if validation fails
 * @returns The sanitized URL if valid, or the default redirect path
 */
export function getSafeRedirectUrl(
  redirectUrl: string | null | undefined,
  defaultPath = '/collection'
): string {
  // implementation
}
```

**Guidelines:**

- Always use TSDoc comments (`/** */`) for exported functions, classes, and types
- Start with a concise one-line summary
- Add a blank line before `@param` tags
- Use `@param paramName - description` format (note the dash after param name)
- Use `@returns` (not `@return`) to describe return value
- Document edge cases and important behavior (e.g., "prevents open redirect attacks")
- For internal/private functions, TSDoc is optional but encouraged
- Keep descriptions clear and actionable - explain the "why" when relevant

**Additional TSDoc tags:**

````typescript
/**
 * Example showing additional tags
 *
 * @param value - The input value
 * @returns The processed result
 * @throws {Error} When value is invalid
 * @example
 * ```typescript
 * const result = processValue('test')
 * ```
 */
````

## API Layer (tRPC)

All Discogs API calls go through tRPC serverless functions. This is required because OAuth 1.0a needs the Consumer Secret to sign every request, and the secret must never be exposed to the client.

**Architecture:**

```
Client (React) → tRPC Client → Vercel Serverless Function → Discogs API
```

**Server-side (`src/server/`):**

- `discogs-client.ts` - Factory to create authenticated `DiscogsClient` instances
- `trpc/init.ts` - tRPC router and procedure definitions
- `trpc/index.ts` - Root router combining all sub-routers
- `trpc/routers/oauth.ts` - OAuth 1.0a token exchange procedures
- `trpc/routers/discogs.ts` - Discogs API proxy procedures (getIdentity, getCollection, getUserProfile)

**Client-side (`src/lib/`):**

- `trpc.ts` - tRPC React client setup with httpBatchLink
- `query-persister.ts` - IndexedDB persistence for TanStack Query cache
- `storage-keys.ts` - Centralized storage key constants
- `cross-tab-sync.ts` - Cross-tab auth synchronization

**Vercel handler (`api/trpc/[trpc].ts`):**

- Single serverless function handling all tRPC routes
- Converts VercelRequest to Web Request for tRPC fetch adapter

**Available tRPC procedures:**

- `oauth.getRequestToken` - Step 1 of OAuth: get request token and authorization URL
- `oauth.getAccessToken` - Step 2 of OAuth: exchange request token for access token
- `discogs.getIdentity` - Get authenticated user's identity
- `discogs.getUserProfile` - Get user profile (avatar, email, collection stats)
- `discogs.getCollection` - Get user's collection releases with pagination
- `discogs.getCollectionMetadata` - Fast metadata check for collection change detection

Constants in `src/lib/constants.ts` define app version and rate limit config. Storage keys are in `src/lib/storage-keys.ts`.

## Vercel Serverless Functions

The `api/` directory contains Vercel Node.js Serverless Functions for server-side tRPC routes. These are compiled separately by Vercel using `moduleResolution: "node16"`, which has stricter import requirements than the client-side code.

**Why Node.js Serverless (not Edge Functions):** The `@lionralfs/discogs-client` library uses `window.crypto` in its browser build. Edge Functions pick the browser bundle (no way to override), causing "window is not defined" errors. Node.js Serverless Functions properly use the Node.js bundle.

**Import requirements for `api/` and `src/server/`:**

1. **Use `.js` extensions** on all relative imports (even though source files are `.ts`)
2. **No `@/` path aliases** - use relative paths only

```typescript
// ❌ Wrong - will fail on Vercel
import { router } from './init'
import { router } from './init.ts'
import type { Foo } from '@/types/foo'

// ✅ Correct - works on Vercel
import { router } from './init.js'
import type { Foo } from '../../../types/foo.js'
```

**Why this differs from client code:**

| Setting             | Client (`tsconfig.app.json`) | Vercel Serverless Functions |
| ------------------- | ---------------------------- | --------------------------- |
| `moduleResolution`  | `bundler`                    | `node16`                    |
| Path aliases (`@/`) | ✓ Supported                  | ✗ Not supported             |
| Import extensions   | Optional                     | Required (`.js`)            |

The local `tsc -b` command uses `tsconfig.server.json` with `moduleResolution: "bundler"`, so these errors only appear when running `vercel build`.

## Authentication

Auth state is managed via Zustand store with React Context wrapper:

- `src/stores/auth-store.ts` - Zustand store for OAuth tokens, session state, username, userId
- `src/providers/auth-context.ts` - AuthContext definition with OAuth state
- `src/providers/auth-provider.tsx` - AuthProvider consuming Zustand store + OAuth validation
- Use the `useAuth()` hook from `src/hooks/use-auth.ts`

**OAuth 1.0a Flow:**

1. User clicks "Login with Discogs"
2. Client calls `oauth.getRequestToken` via tRPC → gets request token + authorization URL
3. Client stores request token secret in sessionStorage, redirects to Discogs
4. User authorizes app on Discogs, redirected back with `oauth_verifier`
5. Client calls `oauth.getAccessToken` with request token + verifier → gets access token
6. Access token stored in Zustand auth store (persisted to localStorage)

**Session Management (Two-tier system):**

| Action                 | Where              | What Happens                         | Next Login                                  |
| ---------------------- | ------------------ | ------------------------------------ | ------------------------------------------- |
| **Sign Out**           | Sidebar dropdown   | Ends session, preserves OAuth tokens | "Welcome back" with Continue/Switch account |
| **Disconnect Discogs** | Settings → Account | Fully removes authorization          | Must re-authorize with Discogs              |

- **Sign Out** (`signOut()`) - Quick logout for temporary breaks. User can quickly continue or switch accounts on next visit.
- **Disconnect** (`disconnect()`) - Full deauthorization. Clears all tokens and caches. Use when switching Discogs accounts or revoking access.
- On mount, if session was active, validates tokens via `discogs.getIdentity`
- Cached profile only used after successful token validation
- **Cross-tab sync**: Logout in one tab automatically logs out all tabs (via `setupCrossTabSync()` in `main.tsx`)

**Login Page States:**

1. **Fresh login** - No existing tokens → "Sign in with Discogs" button
2. **Welcome back** - Tokens exist but signed out → Shows username with "Continue" or "Use different account"

### Post-Login Redirect URL Preservation

Users are returned to their original URL (including query params and hash fragments) after login. This works for:

- **Unauthenticated access**: Visit `/collection?style=Rock#top` → redirect to `/login` → login → return to `/collection?style=Rock#top`
- **Logout/re-login**: Be on `/settings#appearance` → logout → login → return to `/settings#appearance`

Implementation uses sessionStorage (not URL params) for clean login URLs:

- `src/lib/redirect-utils.ts` - Utilities: `storeRedirectUrl()`, `getAndClearRedirectUrl()`, `isValidRedirectUrl()`
- `src/lib/constants.ts` - `SESSION_STORAGE_KEYS.REDIRECT_URL`
- `src/routes/_authenticated.tsx` - Stores URL (pathname + search + hash) before redirecting to login
- `src/components/layout/sidebar-user.tsx` - Stores URL before logout
- `src/routes/login.tsx` - Reads redirect URL via `useEffect` when `isAuthenticated` becomes true

**Security**: `isValidRedirectUrl()` prevents open redirect attacks by:

- Only allowing internal paths (starting with `/`)
- Blocking protocol-relative URLs (`//evil.com`)
- Blocking backslashes (`/\evil.com`)
- Blocking URL-encoded bypass attempts (decodes before validation)
- Blocking exact `/login` path (with query/hash) to prevent redirect loops

**Important**: Navigation after login is handled by a `useEffect` watching `isAuthenticated`, not in the form submit handler. This avoids race conditions with `getAndClearRedirectUrl()` being called twice.

## Layout Components

Layout components in `src/components/layout/`:

- `app-sidebar.tsx` - Main navigation sidebar with Collection, Wantlist (disabled), Settings
- `brand-mark.tsx` - Shared circular VinylDeck mark (login, sidebar, loading)
- `sidebar-user.tsx` - User avatar and logout dropdown in sidebar footer
- `language-toggle.tsx` - Language dropdown (English/Norwegian)
- `mode-toggle.tsx` - Theme switcher (Light/Dark/System)

The sidebar uses shadcn's sidebar component with collapsible functionality.

## Internationalization

- Language auto-detects from system (English/Norwegian)
- Language toggle appears next to the theme toggle

## Collection View Toggle

- Collection supports grid and table views with a toolbar toggle.
- View mode preference is stored via Zustand preferences store (`usePreferencesStore`).
- Table view is designed for responsive use; columns collapse on smaller screens.

## View Transitions

- React 19 ViewTransition API enabled per-link in TanStack Router (`defaultViewTransition: false`, view transitions applied via `viewTransition` prop)
- Smooth fade transitions between pages (300ms duration)
- Respects `prefers-reduced-motion` for accessibility (50ms duration when enabled)
- CSS configured in `src/index.css` with custom fade-in/fade-out animations
- Same-route sidebar navigation prevents redundant transitions

## PWA (Progressive Web App)

- Configured via `vite-plugin-pwa` in `vite.config.ts`
- Icons: Vinyl-themed placeholders (192x192, 512x512) generated via `scripts/generate-icons.js`
- Offline caching:
  - API responses: NetworkFirst strategy, 1-hour cache
  - Cover images: CacheFirst strategy, 30-day cache
- Service worker auto-updates on new deployment

## State Management (Zustand)

Client state is managed via Zustand stores with automatic localStorage persistence:

**Stores (`src/stores/`):**

- `auth-store.ts` - OAuth tokens, session state, username, userId, cachedProfile
- `preferences-store.ts` - View mode, avatar source, Gravatar email

**Key pattern:**

```typescript
import { useAuthStore } from '@/stores/auth-store'
import { usePreferencesStore } from '@/stores/preferences-store'

// Read state
const tokens = useAuthStore((state) => state.tokens)
const viewMode = usePreferencesStore((state) => state.viewMode)

// Actions
const signOut = useAuthStore((state) => state.signOut)
const setViewMode = usePreferencesStore((state) => state.setViewMode)
```

**Benefits over React Context:**

- Simpler code (~283 lines of Context → ~80 lines of stores)
- Built-in localStorage persistence via `persist` middleware
- No provider nesting required for direct store access
- Automatic cross-tab sync for auth state

**IMPORTANT: Always use Zustand for client state persistence.** Do not use raw `localStorage.setItem/getItem` directly. The only exceptions are third-party libraries that manage their own storage:

- `next-themes` - Manages theme preference internally
- `i18next` - Manages language preference internally

For any new client state that needs persistence, add it to an existing Zustand store or create a new one.

## Storage Architecture

Storage has been consolidated from 11 fragmented keys to 4 main keys:

**localStorage keys (`src/lib/storage-keys.ts`):**

| Key                  | Managed By  | Contents                                                     |
| -------------------- | ----------- | ------------------------------------------------------------ |
| `vinyldeck-auth`     | Zustand     | OAuth tokens, sessionActive, username, userId, cachedProfile |
| `vinyldeck-prefs`    | Zustand     | viewMode, avatarSource, gravatarEmail                        |
| `vinyldeck-theme`    | next-themes | Theme preference (light/dark/system)                         |
| `vinyldeck-language` | i18next     | Language preference (en/nb)                                  |

**sessionStorage keys:**

| Key                       | Purpose                       |
| ------------------------- | ----------------------------- |
| `vinyldeck-oauth-request` | Temporary OAuth request token |
| `vinyldeck-redirect`      | Post-login redirect URL       |

**IndexedDB:**

- TanStack Query cache persisted via `idb-keyval` library
- No 5MB localStorage limit (critical for large collections)
- 30-day cache lifetime for expensive API calls

## Query Persistence (IndexedDB)

TanStack Query cache is persisted to IndexedDB for instant page loads:

**Setup (`src/lib/query-persister.ts`):**

- Uses `@tanstack/query-persist-client-core` with `idb-keyval`
- All queries automatically persist to IndexedDB
- 30-day max age for cached data
- `placeholderData: keepPreviousData` shows old data during refetch

**Benefits:**

- Instant page loads from cache (no loading spinners)
- Survives browser restarts
- Scales to large collections (bypasses localStorage 5MB limit)
- Background refetch with old data shown

## Theme Management (next-themes)

Theme is managed via `next-themes` library for FOUC prevention:

**Implementation:**

- `src/providers/theme-provider.tsx` - Wraps app with NextThemesProvider
- `index.html` - Inline script applies theme before React loads
- `src/components/layout/mode-toggle.tsx` - Uses `useTheme()` from next-themes

**Features:**

- No FOUC (flash of unstyled content) on page load
- No flickering on theme toggle (`disableTransitionOnChange`)
- System theme detection (`enableSystem`)
- Persists to `vinyldeck-theme` localStorage key

## Collection Sync (Change Detection)

Detects changes in user's Discogs collection without refetching full data:

**How it works:**

1. User adds vinyl on Discogs website
2. User opens VinylDeck → cached collection loads instantly
3. Background metadata check (1 fast API call) detects count change
4. Banner shows: "5 new items detected - Refresh to see changes"
5. User clicks refresh → full collection refetches in background
6. Old data shown during refresh (no loading spinners)

**Implementation:**

- `src/hooks/use-collection-sync.ts` - Change detection hook
- `src/components/collection/collection-sync-banner.tsx` - UI banner
- `discogs.getCollectionMetadata` - Fast tRPC procedure (fetches count only)

**Usage:**

```typescript
const { hasChanges, newItemsCount, deletedItemsCount, refreshCollection } =
  useCollectionSync()
```

## Future: Collection Aggregation

The current caching architecture is designed to support future collection enrichment with data from multiple Discogs API endpoints.

**The Problem: Discogs Rate Limits**

Discogs imposes strict API rate limits of 60 requests/minute. To avoid hitting limits, we use a conservative 48 requests/minute.

**Aggregation Plan:**

For each album in a collection, fetch 3 additional endpoints by release ID:

| Endpoint          | Data Retrieved                              |
| ----------------- | ------------------------------------------- |
| Marketplace stats | Number for sale, lowest price               |
| Price suggestions | Price by condition (requires seller status) |
| Community data    | Have/want counts, ratings                   |

**Performance Impact:**

- 3 API calls per album = ~16 albums/minute at 48 req/min
- **500 album collection = ~30 minutes to fully load**

**Why This Architecture:**

The robust IndexedDB caching and metadata-based change detection were implemented specifically for this:

1. **Initial load is expensive** - 30 minutes for large collections
2. **Subsequent loads are instant** - Served from IndexedDB cache
3. **Smart invalidation** - Only refetch when items added/removed (detected via `getCollectionMetadata`)
4. **Background updates** - User sees cached data immediately, refresh happens in background
5. **30-day cache lifetime** - Avoids re-waiting on aggregation for returning users

**Implementation Approach (Future):**

```typescript
// Backend only change - frontend adapts automatically
getCollection: protectedProcedure.query(async ({ ctx }) => {
  const collection = await discogsClient.getCollection(username)

  // Rate-limited enrichment (3 calls per item)
  const enriched = await rateLimitedMap(
    collection.releases,
    async (release) => {
      const [marketplace, prices, community] = await Promise.all([
        discogsClient.getMarketplaceStats(release.id),
        discogsClient.getPriceSuggestions(release.id),
        discogsClient.getCommunityData(release.id)
      ])
      return { ...release, marketplace, prices, community }
    },
    { requestsPerMinute: 48 }
  )

  return { ...collection, releases: enriched }
})
```

**Key Design Decisions:**

- Zero frontend changes needed when aggregation is added
- TanStack Query + IndexedDB handles larger payloads automatically
- Metadata check still works (count-based, not content-based)
- `placeholderData: keepPreviousData` shows old data during 30-min refresh

## Security

**Content Security Policy (CSP):**

CSP headers are configured in `vercel.json` to prevent XSS attacks:

- `script-src 'self'` - Only same-origin scripts (blocks injected scripts)
- `style-src 'self' 'unsafe-inline'` - Allows Tailwind inline styles
- `img-src` - Whitelists Discogs and Gravatar image domains
- `connect-src` - Whitelists API endpoints and Vercel services
- `frame-ancestors 'none'` - Prevents clickjacking

**FOUC prevention script:**

The theme initialization script (`public/theme-init.js`) is loaded as an external file rather than inline to avoid CSP hash maintenance issues. External scripts are covered by `script-src 'self'` automatically.

**Cross-tab auth sync:**

- Logout in one tab automatically logs out all tabs
- Prevents stale authenticated sessions
- Implemented via `storage` event listener in `src/lib/cross-tab-sync.ts`
