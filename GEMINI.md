This file provides guidance for automated agents and AI assistants when working with code in this repository.

## Build & Development Commands

- `bun dev` - Start development server with HMR
- `bun run build` - Type-check with TypeScript and build for production
- `bun run lint` - Run ESLint
- `bun run preview` - Preview production build locally
- `bun run test` - Run tests in watch mode
- `bun run test:run` - Run tests once
- `bun run test:coverage` - Run tests with coverage report
- `bun run test:ui` - Run tests with UI

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
4. CI runs tests automatically
5. **Squash merge** the PR into `main`
6. release-please automatically creates/updates a release PR
7. When ready to release, merge the release-please PR

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
- CI runs tests on PRs and pushes to `main`
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
- **TanStack Query** for server state management
- **i18next** for internationalization
- **country-flag-icons** for lightweight flag icons
- **Vitest** + **React Testing Library** + **MSW** for testing
- **PWA** via vite-plugin-pwa

## Project Structure

- `src/api/` - API client, rate limiter, and Discogs API functions
- `src/components/ui/` - shadcn/ui components (added via `bunx shadcn add <component>`)
- `src/components/layout/` - Layout components (sidebar, brand mark, toggles)
- `src/components/collection/` - Collection view components
- `src/components/auth/` - Authentication components
- `src/hooks/` - Custom React hooks (auth, collection, preferences, theme)
- `src/lib/` - Utility functions, constants, storage, gravatar helpers
- `src/locales/` - i18n translation files
- `src/providers/` - React context providers (auth, theme, preferences, query, i18n)
- `src/routes/` - TanStack Router file-based routes
- `src/types/` - TypeScript type definitions
- `src/__tests__/` - Test files and mocks

## Path Aliases

Use `@/` to import from `src/`:

```typescript
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

## Adding shadcn Components

```bash
bunx shadcn add <component-name>
```

Components are placed in `src/components/ui/` and use the new-york style with lucide icons.

## Routing

Routes are defined in `src/routes/` using TanStack Router's file-based routing:

- `__root.tsx` - Root layout with dark mode, toaster, and 404 handler
- `index.tsx` - Redirects to `/collection` if authenticated, `/login` if not
- `login.tsx` - Login page with username/token form
- `_authenticated.tsx` - Layout route with auth guard, redirects to `/login` if not authenticated
- `_authenticated/collection.tsx` - Collection page (full implementation)
- `_authenticated/settings.tsx` - Settings page with app version

## Testing

Tests use Vitest with React Testing Library and MSW for API mocking:

- `src/__tests__/setup.ts` - Test setup with MSW server
- `src/__tests__/mocks/` - MSW handlers and server config
- Tests are organized under `src/__tests__/{api,hooks,components,integration}`
- `src/__tests__/hooks/use-collection.test.tsx` covers client-side filter + pagination interactions

## API Layer

The Discogs API client is in `src/api/`:

- `client.ts` - Axios instance with auth interceptor and rate limiting
- `discogs.ts` - API functions (`getIdentity`, `validateCredentials`, `getCollection`)
- `rate-limiter.ts` - Tracks Discogs rate limits (60 req/min) from response headers

Storage helpers in `src/lib/storage.ts` handle token/username persistence in localStorage.

Constants in `src/lib/constants.ts` define app version, API URL, storage keys, and rate limit config.

## Authentication

Auth is managed via React Context in `src/providers/`:

- `auth-context.ts` - AuthContext definition
- `auth-provider.tsx` - AuthProvider with login/logout/token validation
- Use the `useAuth()` hook from `src/hooks/use-auth.ts`

Auth flow:

1. On mount, always validates stored token via `/oauth/identity` (never trusts cached identity)
2. Cached user profile is only used after successful token validation
3. Login validates credentials, stores token/username in localStorage
4. Logout clears localStorage and resets state

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
- View mode preference is stored in localStorage (`STORAGE_KEYS.VIEW_MODE`).
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
