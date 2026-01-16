# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `bun dev` - Start development server with HMR
- `bun run build` - Type-check with TypeScript and build for production
- `bun run lint` - Run ESLint
- `bun run preview` - Preview production build locally
- `bun run test` - Run tests in watch mode
- `bun run test:run` - Run tests once
- `bun run test:coverage` - Run tests with coverage report
- `bun run test:ui` - Run tests with UI

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
- **Vitest** + **React Testing Library** + **MSW** for testing
- **PWA** via vite-plugin-pwa

## Project Structure

- `src/api/` - API client, rate limiter, and Discogs API functions
- `src/components/ui/` - shadcn/ui components (added via `bunx shadcn add <component>`)
- `src/components/layout/` - Layout components (sidebar, app layout)
- `src/components/collection/` - Collection view components
- `src/components/auth/` - Authentication components
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utility functions and constants
- `src/locales/` - i18n translation files
- `src/providers/` - React context providers
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
- `_authenticated/collection.tsx` - Collection page (placeholder)
- `_authenticated/settings.tsx` - Settings page with app version

## Testing

Tests use Vitest with React Testing Library and MSW for API mocking:

- `src/__tests__/setup.ts` - Test setup with MSW server
- `src/__tests__/mocks/` - MSW handlers and server config
- Place tests next to source files or in `src/__tests__/`

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

1. On mount, validates stored token via `/oauth/identity`
2. Login validates credentials, stores token/username in localStorage
3. Logout clears localStorage and resets state

## Layout Components

Layout components in `src/components/layout/`:

- `app-sidebar.tsx` - Main navigation sidebar with Collection, Wantlist (disabled), Settings
- `sidebar-user.tsx` - User avatar and logout dropdown in sidebar footer

The sidebar uses shadcn's sidebar component with collapsible functionality.
