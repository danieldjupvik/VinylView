# VinylView MVP Implementation Plan

## Overview

A modern web application for browsing Discogs vinyl collections. The MVP focuses on authentication and the Collection view, with architecture designed for future expansion.

## MVP Scope

- **In scope**: Login (Username + PAT), View Collection (vinyl-only grid), Logout, Dark theme, PWA
- **Out of scope (future)**: Wantlist, Collection Value/Stats, OAuth, Light theme

---

## Architecture Decisions

### Navigation: Collapsible Sidebar

Recommended for scalability (5+ future pages), mobile-friendly collapse, and maximum content width for the vinyl grid.

### State Management

- **Server state**: TanStack Query (collection data, user identity)
- **Client state**: React Context (auth only)
- **Persistence**: localStorage (token, username)

### Vinyl Filtering

Client-side filtering by `formats[].name === "Vinyl"` since Discogs API doesn't support server-side format filtering.

### Rate Limiting

Token bucket pattern respecting 60 req/min with buffer, tracking via response headers.

---

## Folder Structure

```
src/
├── api/
│   ├── client.ts              # Axios instance with auth, rate limiting
│   ├── discogs.ts             # API endpoint functions
│   ├── rate-limiter.ts        # Rate limit tracking
│   └── types.ts               # API response types
├── components/
│   ├── ui/                    # shadcn components
│   ├── layout/
│   │   ├── app-layout.tsx     # Main layout wrapper
│   │   ├── app-sidebar.tsx    # Navigation sidebar
│   │   └── sidebar-user.tsx   # User info + logout
│   ├── collection/
│   │   ├── vinyl-grid.tsx     # Responsive cover art grid
│   │   ├── vinyl-card.tsx     # Individual vinyl card
│   │   ├── vinyl-card-skeleton.tsx
│   │   ├── collection-toolbar.tsx  # Search, sort controls
│   │   └── pagination-controls.tsx
│   └── auth/
│       └── login-form.tsx
├── hooks/
│   ├── use-auth.ts
│   └── use-collection.ts
├── lib/
│   ├── utils.ts               # (exists) + extend
│   ├── constants.ts           # Version, API URL
│   └── storage.ts             # localStorage helpers
├── locales/en/
│   └── translation.json
├── providers/
│   ├── auth-provider.tsx
│   ├── query-provider.tsx
│   └── i18n-provider.tsx
├── routes/
│   ├── __root.tsx             # Root layout, dark mode
│   ├── _authenticated.tsx     # Auth guard + sidebar layout
│   ├── _authenticated/
│   │   ├── collection.tsx
│   │   └── settings.tsx
│   ├── login.tsx
│   └── index.tsx              # Redirect logic
├── types/
│   └── discogs.ts
└── __tests__/
    ├── setup.ts                 # Test setup with mocks
    ├── mocks/
    │   ├── handlers.ts          # MSW API handlers
    │   └── server.ts            # MSW server setup
    ├── api/
    │   ├── rate-limiter.test.ts
    │   └── discogs.test.ts
    ├── hooks/
    │   ├── use-auth.test.ts
    │   └── use-collection.test.ts
    ├── components/
    │   ├── login-form.test.tsx
    │   ├── vinyl-card.test.tsx
    │   └── vinyl-grid.test.tsx
    └── integration/
        └── auth-flow.test.tsx
public/
├── manifest.json
└── icons/
```

---

## Dependencies to Install

```bash
# Runtime
bun add @tanstack/react-query @tanstack/react-router axios motion react-i18next i18next

# Development
bun add -D @tanstack/router-plugin @tanstack/router-devtools vite-plugin-pwa workbox-window

# Testing
bun add -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @vitest/coverage-v8
```

## shadcn Components to Add

```bash
bunx shadcn add button input card skeleton sidebar sonner scroll-area dropdown-menu separator avatar tooltip label
```

---

## Implementation Phases

### Phase 1: Foundation

1. Install all dependencies
2. Add shadcn components
3. Create folder structure
4. Configure TanStack Router plugin in `vite.config.ts`
5. Configure PWA plugin in `vite.config.ts`
6. Set up i18next with English translations
7. Create `.nvmrc` file

**Files to modify:**

- `vite.config.ts` - Add router and PWA plugins
- `package.json` - Dependencies added via bun

### Phase 2: Core Infrastructure

1. Create `src/lib/constants.ts` - App version, API base URL
2. Create `src/lib/storage.ts` - Token/username persistence
3. Create `src/api/rate-limiter.ts` - Rate limit tracking class
4. Create `src/api/client.ts` - Axios instance with interceptors
5. Create `src/api/discogs.ts` - API functions
6. Create `src/types/discogs.ts` - TypeScript interfaces

**Key API Endpoints:**

- `GET /oauth/identity` - Validate token, get username
- `GET /users/{username}/collection/folders/0/releases` - Collection items

### Phase 3: State & Providers

1. Create `src/providers/query-provider.tsx`
2. Create `src/providers/auth-provider.tsx`
3. Create `src/providers/i18n-provider.tsx`
4. Create `src/hooks/use-auth.ts`
5. Update `src/main.tsx` - Wrap with providers

### Phase 4: Routing

1. Create `src/routes/__root.tsx` - Dark mode, toaster
2. Create `src/routes/login.tsx` - Public login page
3. Create `src/routes/_authenticated.tsx` - Auth guard + layout
4. Create `src/routes/_authenticated/collection.tsx`
5. Create `src/routes/_authenticated/settings.tsx` - Version display
6. Create `src/routes/index.tsx` - Redirect logic
7. Update `src/App.tsx` - Router integration

### Phase 5: Layout Components

1. Create `src/components/layout/app-layout.tsx`
2. Create `src/components/layout/app-sidebar.tsx`
3. Create `src/components/layout/sidebar-user.tsx`

**Sidebar Structure:**

- Header: Logo placeholder + "VinylView"
- Browse section: Collection (active), Wantlist (future, disabled)
- Settings at bottom
- Footer: User avatar, username, logout dropdown

### Phase 6: Auth Components

1. Create `src/components/auth/login-form.tsx`
2. Wire up validation via `/oauth/identity`
3. Add toast notifications (sonner)

### Phase 7: Collection Components

1. Create `src/hooks/use-collection.ts` - TanStack Query hook
2. Create `src/components/collection/vinyl-card.tsx`
3. Create `src/components/collection/vinyl-card-skeleton.tsx`
4. Create `src/components/collection/vinyl-grid.tsx`
5. Create `src/components/collection/collection-toolbar.tsx`
6. Create `src/components/collection/pagination-controls.tsx`

**Collection Features:**

- Grid view with cover art focus
- Client-side vinyl filtering
- Sort: Artist, Title, Date Added
- Search: Filter by artist/title
- Pagination with 100 items/page

### Phase 8: Animations & Polish

1. Add motion animations:
   - Page transitions (fade/slide)
   - Card hover effects (scale, shadow)
   - Loading skeleton pulse
2. Responsive testing (mobile, tablet, desktop)
3. PWA manifest and icons
4. Service worker for offline caching
5. Clean up demo files (App.css, placeholder content)

### Phase 9: Testing

1. Configure Vitest in `vite.config.ts`
2. Create test setup file with global mocks
3. Set up MSW for API mocking
4. Write unit tests for core utilities
5. Write component tests
6. Write integration tests for auth flow
7. Add test script to `package.json`

**Test Coverage Goals:**

- API layer: Rate limiter, Discogs API client
- Hooks: useAuth, useCollection
- Components: LoginForm, VinylCard, VinylGrid
- Integration: Complete login → collection flow

---

## Testing Strategy

### Testing Stack

- **Vitest**: Fast, Vite-native test runner
- **React Testing Library**: Component testing with user-centric approach
- **MSW (Mock Service Worker)**: API mocking for realistic testing
- **@testing-library/user-event**: User interaction simulation

### Test Structure

```
src/__tests__/
├── setup.ts              # Global test setup, mocks
├── mocks/
│   ├── handlers.ts       # MSW request handlers
│   └── server.ts         # MSW server configuration
├── api/                  # Unit tests for API layer
├── hooks/                # Hook tests with renderHook
├── components/           # Component tests
└── integration/          # Full flow tests
```

### Test Categories

#### 1. Unit Tests (API Layer)

```typescript
// rate-limiter.test.ts
- Should track remaining requests from headers
- Should throttle when remaining < 5
- Should reset after window expires

// discogs.test.ts
- Should include auth header in requests
- Should handle 401 unauthorized
- Should handle 429 rate limit exceeded
```

#### 2. Hook Tests

```typescript
// use-auth.test.ts
- Should return isAuthenticated: false when no token
- Should validate token on mount
- Should clear token on logout
- Should persist token on successful login

// use-collection.test.ts
- Should fetch collection releases
- Should filter vinyl-only records
- Should handle pagination
- Should apply sort/search filters
```

#### 3. Component Tests

```typescript
// login-form.test.tsx
- Should render username and token inputs
- Should show validation errors for empty fields
- Should call login on valid submit
- Should display error toast on failed login

// vinyl-card.test.tsx
- Should render cover art image
- Should display artist and title
- Should show format information
- Should handle missing cover art gracefully

// vinyl-grid.test.tsx
- Should render loading skeletons
- Should display vinyl cards in grid
- Should show empty state when no results
- Should respond to search/sort changes
```

#### 4. Integration Tests

```typescript
// auth-flow.test.tsx
- Complete login flow: form submit → API call → redirect
- Protected route redirect when unauthenticated
- Logout flow: button click → clear storage → redirect
- Token refresh on app reload
```

### MSW Handlers

```typescript
// handlers.ts
export const handlers = [
  // Identity endpoint
  http.get('https://api.discogs.com/oauth/identity', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Discogs token=valid-token') {
      return HttpResponse.json({ username: 'testuser', id: 123 })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  // Collection endpoint
  http.get(
    'https://api.discogs.com/users/:username/collection/folders/0/releases',
    () => {
      return HttpResponse.json({
        pagination: { pages: 2, page: 1, per_page: 100, items: 150 },
        releases: mockReleases
      })
    }
  )
]
```

### Test Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

### Vitest Configuration

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/__tests__/**', 'src/components/ui/**']
    }
  }
})
```

### Coverage Targets

- Statements: 70%+
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+

Exclude from coverage: shadcn/ui components (third-party), test files, type definitions.

---

## Key Technical Details

### Authentication Flow

```
App Load → Check localStorage for token
  ├─ No token → Redirect to /login
  └─ Has token → Validate via /oauth/identity
       ├─ Valid → Load /collection
       └─ Invalid → Clear token, redirect to /login

Login Submit → Call /oauth/identity with PAT
  ├─ Success → Store token, redirect to /collection
  └─ Failure → Show error toast
```

### Rate Limiting Strategy

```typescript
// Track via response headers
X-Discogs-Ratelimit: 60
X-Discogs-Ratelimit-Used: 12
X-Discogs-Ratelimit-Remaining: 48

// Throttle when remaining < 5
// Wait for window reset before continuing
```

### Vinyl Filtering Logic

```typescript
const isVinyl = (release) =>
  release.basic_information.formats.some((f) => f.name === 'Vinyl')
```

### Large Collection Strategy

- Fetch 100 items per page (API max)
- Cache pages in TanStack Query
- Show skeletons during loading
- Consider virtual scrolling for 1000+ items (future)

---

## Verification Plan

### Manual Testing Checklist

1. **Login Flow**
   - [ ] Invalid credentials show error toast
   - [ ] Valid credentials redirect to collection
   - [ ] Token persists across browser refresh
   - [ ] Logout clears token and redirects to login

2. **Collection View**
   - [ ] Grid displays vinyl covers
   - [ ] Only vinyl records shown (no CDs)
   - [ ] Sort by artist/title/date works
   - [ ] Search filters results
   - [ ] Pagination loads more items
   - [ ] Skeleton loaders during fetch

3. **Responsive Design**
   - [ ] Mobile: Sidebar as drawer, single column grid
   - [ ] Tablet: Collapsed sidebar, 2-3 column grid
   - [ ] Desktop: Full sidebar, 4+ column grid

4. **PWA**
   - [ ] Manifest loads correctly
   - [ ] App installable on mobile
   - [ ] Offline: Shows cached collection

5. **Rate Limiting**
   - [ ] Large collection (100+ items) loads without 429 errors
   - [ ] Throttling prevents API limit exceeded

### Build & Test Verification

```bash
bun run lint       # No ESLint errors
bun run test:run   # All tests pass
bun run test:coverage  # Coverage meets 70% threshold
bun run build      # TypeScript compiles, Vite builds
bun run preview    # Production build works locally
```

---

## Files to Modify (Existing)

| File               | Changes                                  |
| ------------------ | ---------------------------------------- |
| `vite.config.ts`   | Add TanStack Router plugin, PWA plugin   |
| `src/main.tsx`     | Wrap app with providers, add router      |
| `src/App.tsx`      | Replace demo content with RouterProvider |
| `src/index.css`    | Ensure dark mode variables active        |
| `src/lib/utils.ts` | Keep as-is, extend if needed             |

## Files to Create (New)

~45 new files across api/, components/, hooks/, lib/, locales/, providers/, routes/, types/, **tests**/, and public/

---

## Notes

- **OAuth Ready**: Auth provider designed for future OAuth swap
- **i18n Ready**: All user-facing strings in translation files
- **PWA Ready**: Manifest, icons, service worker included
- **Version Display**: Settings page shows app version from constants
- **Test Ready**: Vitest + RTL + MSW configured with 70%+ coverage target
