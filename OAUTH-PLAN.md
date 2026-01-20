# Discogs OAuth Implementation Plan (OAuth-Only)

## Overview

Replace Personal Access Token (PAT) authentication with Discogs OAuth 1.0a as the **only** login method. This implementation uses:

- **Vercel Functions** - Serverless backend for secure OAuth token exchange
- **tRPC** - Type-safe frontend ↔ backend communication
- **@lionralfs/discogs-client** - Type-safe Discogs API SDK (server-side only)

**Why OAuth-only?**

- Better UX (one-click login, no token generation/copying)
- More secure (Consumer Secret stays server-side)
- Simpler codebase (no dual auth paths)
- Foundation for future server-side features

**Architecture change:**

```
Before (PAT):
  User → Generate PAT on Discogs → Copy/paste into app → Client calls Discogs API directly

After (OAuth):
  User → Click "Sign in" → Authorize on Discogs → Return to app
  ALL Discogs API calls go through server (requires Consumer Secret for signing)
  Server signs requests with OAuth headers and proxies to Discogs
```

**Why all API calls must go through the server:**

OAuth 1.0a PLAINTEXT signatures require `consumer_secret&token_secret` for every authenticated request. Discogs explicitly states: _"You should not share your consumer secret, as it acts as a sort of password for your requests."_

This means:

- The Consumer Secret must stay server-side only
- Every Discogs API call needs the Consumer Secret to sign the request
- Therefore, all API calls must be proxied through our server

This is a more significant change than originally planned, but it's the secure way to implement OAuth 1.0a. The server will:

1. Receive requests from the client (with user's access token)
2. Sign requests using Consumer Secret + Access Token Secret
3. Forward to Discogs API
4. Return responses to client

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)                       │
├─────────────────────────────────────────────────────────────────┤
│  Login Page          │  OAuth Callback      │  API Client       │
│  - OAuth button      │  - /oauth-callback   │  - Calls server   │
│  - Simple, one-click │  - Token exchange    │  - No direct API  │
└──────────┬───────────┴──────────┬───────────┴─────────┬─────────┘
           │                      │                     │
           │              tRPC Client                   │
           │         (OAuth + all API calls)            │
           └──────────────────────┬─────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                    Vercel Functions                              │
├──────────────────────────────────────────────────────────────────┤
│  /api/trpc/[trpc].ts                                             │
│  └── oauth router                                                │
│      ├── getRequestToken (uses Consumer Secret)                  │
│      └── getAccessToken  (uses Consumer Secret)                  │
│  └── discogs router (NEW - proxies all Discogs API calls)        │
│      ├── getIdentity                                             │
│      ├── getCollection                                           │
│      ├── getUserProfile                                          │
│      └── ... (all Discogs endpoints)                             │
│                                                                  │
│  @lionralfs/discogs-client (server-side, signs all requests)     │
└──────────────────────────────────┬───────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────┐
│                        Discogs API                                │
│  - /oauth/request_token  (via server)                             │
│  - /oauth/authorize      (user redirect)                          │
│  - /oauth/access_token   (via server)                             │
│  - All other endpoints   (via server, signed with Consumer Secret)│
└───────────────────────────────────────────────────────────────────┘
```

**Key point:** ALL Discogs API calls go through the server. The server signs each request using the Consumer Secret (which must never be exposed to the client). The `@lionralfs/discogs-client` package handles OAuth signing server-side.

---

## Environment Setup

**Local development:** Create a separate Discogs app with `http://localhost:5173/oauth-callback` as the callback URL. Use `bun dev` which runs both Vite (port 5173) and the API server (port 3001) concurrently with automatic proxying.

**Production:** Use your production Discogs app with your production domain callback.

`.env.example` (commit to repo):

```env
# Discogs OAuth - Get from https://www.discogs.com/settings/developers
# Create separate apps for local dev and production
VITE_DISCOGS_CONSUMER_KEY=
DISCOGS_CONSUMER_SECRET=
```

`.env.local` (gitignored, for local dev):

```env
VITE_DISCOGS_CONSUMER_KEY=your_dev_consumer_key
DISCOGS_CONSUMER_SECRET=your_dev_consumer_secret
```

**Vercel Environment Variables** (production):

- `VITE_DISCOGS_CONSUMER_KEY` - Your production consumer key
- `DISCOGS_CONSUMER_SECRET` - Your production consumer secret

---

## Implementation Phases

### Progress

| Phase | Description                              | Status |
| ----- | ---------------------------------------- | ------ |
| 1     | Serverless API Infrastructure            | ✅     |
| 2     | OAuth Callback Route                     | ✅     |
| 3     | Login Page Update                        | ✅     |
| 4     | Server-side Discogs Client Helper        | ✅     |
| 5     | Identity Endpoint + Auth Provider Update | ⬜     |
| 6     | User Profile Endpoint                    | ⬜     |
| 7     | Collection Endpoint + Hook Migration     | ⬜     |
| 8     | Storage & PAT Cleanup                    | ⬜     |
| 9     | i18n Updates                             | ⬜     |
| 10    | Tests                                    | ⬜     |

> **Architecture Note:** All Discogs API calls must go through the server because OAuth 1.0a requires the Consumer Secret to sign every request. The `@lionralfs/discogs-client` handles signing automatically when configured with OAuth credentials.

> **Rate Limiting Strategy:** Keep client-side rate limiting. The `@lionralfs/discogs-client` returns `{ data, rateLimit }` where `rateLimit` contains `{ limit, used, remaining }`. Each tRPC response includes this data, and the client-side `RateLimiter` can update from it instead of HTTP headers. The library does NOT auto-throttle—our client-side rate limiter handles waiting.

**Migration Approach:**

1. **Incremental migration**: Each API endpoint is migrated one at a time with verification
2. **Dual support during transition**: Auth provider can temporarily support both OAuth and PAT until fully migrated
3. **Rate limit continuity**: Rate limit data flows from Discogs → `@lionralfs/discogs-client` → tRPC response → client-side `RateLimiter`

---

### Phase 1: Serverless API Infrastructure ✅

**Goal:** Get tRPC + Vercel Functions working with proper TypeScript/ESLint config.

**Install dependencies:**

```bash
bun add @trpc/client @trpc/react-query @trpc/server zod @tanstack/react-query @lionralfs/discogs-client
```

Note: `@tanstack/react-query` is already installed, but tRPC needs specific version compatibility.

**Directory structure:**

```
api/
  trpc/
    [trpc].ts              # Vercel Function entry point
src/
  server/
    trpc/
      index.ts             # tRPC instance + router setup
      routers/
        oauth.ts           # OAuth procedures
  lib/
    trpc.ts                # tRPC React client
```

**Files to create:**

1. `api/trpc/[trpc].ts` - Vercel Function handler
2. `src/server/trpc/index.ts` - tRPC setup and root router
3. `src/server/trpc/routers/oauth.ts` - OAuth procedures
4. `src/lib/trpc.ts` - React client setup

**TypeScript config:** Create `tsconfig.server.json` for API files (Node.js target).

**ESLint:** Ensure `api/` directory is included in lint config.

**Verification:** Deploy to Vercel preview, call `/api/trpc/oauth.getRequestToken` and verify response.

---

### Phase 2: OAuth Callback Route

**Goal:** Handle the OAuth callback after user authorizes on Discogs.

**Create:** `src/routes/oauth-callback.tsx`

**Flow:**

1. User clicks "Sign in with Discogs"
2. Frontend calls `trpc.oauth.getRequestToken`
3. Store `requestTokenSecret` in sessionStorage
4. Redirect user to Discogs authorization URL
5. User authorizes, Discogs redirects to `/oauth-callback?oauth_token=...&oauth_verifier=...`
6. Callback page calls `trpc.oauth.getAccessToken`
7. Store access tokens in localStorage
8. Validate identity via `/oauth/identity`
9. Navigate to collection (or stored redirect URL)

**Session storage key:** `vinyldeck_oauth_request_secret` (temporary, cleared after exchange)

---

### Phase 3: Login Page Update

**Goal:** Replace PAT form with single OAuth button.

**Changes to `src/routes/login.tsx`:**

- Remove username/token form fields
- Add "Sign in with Discogs" button
- Show loading state during redirect
- Keep existing animations and styling

**New login flow:**

```tsx
<Button onClick={handleOAuthLogin}>Sign in with Discogs</Button>
```

---

### Phase 4: Server-side Discogs Client Helper

**Goal:** Create a reusable helper to instantiate an authenticated `DiscogsClient` from OAuth tokens.

**Create:** `src/server/discogs-client.ts`

```typescript
import { DiscogsClient } from '@lionralfs/discogs-client'

const CONSUMER_KEY = process.env.VITE_DISCOGS_CONSUMER_KEY!
const CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET!

export function createDiscogsClient(
  accessToken: string,
  accessTokenSecret: string
) {
  return new DiscogsClient({
    auth: {
      method: 'oauth',
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET,
      accessToken,
      accessTokenSecret
    },
    userAgent: 'VinylDeck/1.0'
  })
}
```

**Verification:**

- [ ] File compiles without TypeScript errors
- [ ] ESLint passes

---

### Phase 5: Identity Endpoint + Auth Provider Update

**Goal:** Add `discogs.getIdentity` tRPC procedure and update auth provider to use OAuth tokens.

This is the critical phase that enables the full OAuth flow to work end-to-end.

**Step 5a: Create discogs router with getIdentity**

**Create:** `src/server/trpc/routers/discogs.ts`

```typescript
import { z } from 'zod'
import { publicProcedure, router } from '../init'
import { createDiscogsClient } from '../../discogs-client'

export const discogsRouter = router({
  getIdentity: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string()
      })
    )
    .query(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )
      const { data, rateLimit } = await client.getIdentity()
      return {
        identity: data,
        rateLimit // Pass through for client-side tracking
      }
    })
})
```

**Update:** `src/server/trpc/index.ts` to include discogs router

**Step 5b: Update auth provider for OAuth**

**Changes to `src/providers/auth-context.ts`:**

- Add `oauthTokens: { accessToken: string; accessTokenSecret: string } | null` to state
- Remove `login()`, add `loginWithOAuth()` and `setOAuthTokens()`

**Changes to `src/providers/auth-provider.tsx`:**

- On mount: Check for OAuth tokens in localStorage (not PAT)
- If tokens exist: Call `trpc.discogs.getIdentity` to validate
- Store OAuth tokens in state for passing to tRPC calls
- Remove old PAT validation logic

**Step 5c: Update OAuth callback to complete flow**

**Changes to `src/routes/oauth-callback.tsx`:**

- After getting access tokens, call `trpc.discogs.getIdentity` to validate
- Store identity data, navigate to collection

**Verification:**

- [ ] Complete OAuth flow works: Login → Discogs → Callback → Collection
- [ ] Refresh page maintains auth state (validates tokens)
- [ ] Invalid/expired tokens redirect to login
- [ ] TypeScript compiles without errors
- [ ] ESLint passes

---

### Phase 6: User Profile Endpoint

**Goal:** Add `discogs.getUserProfile` tRPC procedure and update auth provider to fetch profile.

**Add to `src/server/trpc/routers/discogs.ts`:**

```typescript
getUserProfile: publicProcedure
  .input(
    z.object({
      accessToken: z.string(),
      accessTokenSecret: z.string(),
      username: z.string()
    })
  )
  .query(async ({ input }) => {
    const client = createDiscogsClient(
      input.accessToken,
      input.accessTokenSecret
    )
    const { data, rateLimit } = await client.user().getProfile(input.username)
    return { profile: data, rateLimit }
  })
```

**Update auth provider:**

- After identity validation, fetch user profile via tRPC
- Update avatar URL from profile response

**Verification:**

- [ ] User avatar displays correctly after login
- [ ] Gravatar email is extracted from profile
- [ ] Rate limit headers are passed through

---

### Phase 7: Collection Endpoint + Hook Migration

**Goal:** Add `discogs.getCollection` tRPC procedure and migrate `use-collection.ts` hook.

This is the largest migration since the collection hook does batch fetching.

**Step 7a: Add collection endpoint**

**Add to `src/server/trpc/routers/discogs.ts`:**

```typescript
getCollection: publicProcedure
  .input(
    z.object({
      accessToken: z.string(),
      accessTokenSecret: z.string(),
      username: z.string(),
      page: z.number().optional().default(1),
      perPage: z.number().optional().default(50),
      sort: z
        .enum([
          'label',
          'artist',
          'title',
          'catno',
          'format',
          'rating',
          'added',
          'year'
        ])
        .optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  )
  .query(async ({ input }) => {
    const client = createDiscogsClient(
      input.accessToken,
      input.accessTokenSecret
    )
    const { data, rateLimit } = await client
      .user()
      .collection()
      .getReleases(input.username, 0, {
        page: input.page,
        per_page: input.perPage,
        sort: input.sort,
        sort_order: input.sortOrder
      })
    return { collection: data, rateLimit }
  })
```

**Step 7b: Update use-collection hook**

**Changes to `src/hooks/use-collection.ts`:**

- Import tRPC client instead of `getCollection` from discogs.ts
- Get OAuth tokens from auth context
- Call `trpc.discogs.getCollection.useQuery()` instead of direct API call
- Update rate limiter from response's `rateLimit` object

**Key consideration:** The hook currently does batch fetching for client-side filtering. With tRPC:

```typescript
// Old: direct API call
const response = await getCollection(username, params)

// New: tRPC call
const response = await trpc.discogs.getCollection.fetch({
  accessToken: tokens.accessToken,
  accessTokenSecret: tokens.accessTokenSecret,
  username,
  ...params
})
```

**Verification:**

- [ ] Collection page loads and displays releases
- [ ] Pagination works correctly
- [ ] Client-side filtering still works (batch fetching)
- [ ] Sorting works (both server-side and client-side sorts)
- [ ] Rate limiting tracked correctly
- [ ] TypeScript compiles without errors

---

### Phase 8: Storage & PAT Cleanup

**Goal:** Clean up storage layer and remove all PAT-related code.

**Step 8a: Storage cleanup**

**Update `src/lib/constants.ts`:**

- Remove `TOKEN` from `STORAGE_KEYS`
- Keep OAuth token keys (already added)

**Update `src/lib/storage.ts`:**

- Remove: `getToken()`, `setToken()`, `removeToken()`
- Ensure `clearAuth()` clears OAuth tokens

**Step 8b: Remove old API client**

**Update `src/api/client.ts`:**

- Remove the Axios instance (no longer needed for direct API calls)
- Or keep it for non-authenticated calls if needed

**Update `src/api/discogs.ts`:**

- Remove all functions that are now handled by tRPC
- Keep `isVinylRecord()` helper (it's a pure function, not an API call)
- Remove OAuth client-side functions (`getOAuthRequestToken`, `getOAuthAccessToken`)

**Step 8c: Remove PAT login code**

- Ensure auth provider has no PAT logic
- Ensure login page has no PAT form remnants

**Verification:**

- [ ] No references to `getToken()` or PAT token
- [ ] `src/api/discogs.ts` only has helper functions
- [ ] Full OAuth flow still works
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds

---

### Phase 9: i18n Updates

**Goal:** Add/update translation strings.

**New keys to add:**

```json
{
  "auth": {
    "signInWithDiscogs": "Sign in with Discogs",
    "redirecting": "Redirecting to Discogs...",
    "oauthError": "Failed to connect to Discogs. Please try again.",
    "oauthDenied": "Authorization was denied.",
    "oauthMissingParams": "Missing authentication parameters.",
    "oauthSessionExpired": "Your session expired. Please try again.",
    "backToLogin": "Back to login"
  }
}
```

**Keys to remove:** `auth.username`, `auth.token`, `auth.usernamePlaceholder`, `auth.tokenPlaceholder`

**Update both:** `src/locales/en.json` and `src/locales/no.json`

**Verification:**

- [ ] All strings render correctly in English
- [ ] All strings render correctly in Norwegian
- [ ] No missing translation warnings in console

---

### Phase 10: Tests

**Goal:** Update existing tests and add OAuth tests.

**Test updates:**

- Mock tRPC client in test setup
- Update auth provider tests for OAuth flow
- Update login page tests (OAuth button instead of form)
- Add OAuth callback page tests
- Update collection hook tests to use mocked tRPC

**Verification:**

- [ ] `bun run test:run` passes
- [ ] CI pipeline green
- [ ] Coverage maintained

---

## OAuth Flow Diagram

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │     │ Frontend │     │  Server  │     │ Discogs  │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │
     │ Click Login    │                │                │
     │───────────────>│                │                │
     │                │                │                │
     │                │ getRequestToken│                │
     │                │───────────────>│                │
     │                │                │ oauth.getRequestToken
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ token + secret │
     │                │                │<───────────────│
     │                │                │                │
     │                │ token + authUrl│                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ Store secret   │                │
     │                │ in sessionStorage               │
     │                │                │                │
     │  Redirect to Discogs auth page  │                │
     │<───────────────│                │                │
     │                │                │                │
     │ Authorize app  │                │                │
     │─────────────────────────────────────────────────>│
     │                │                │                │
     │ Redirect to /oauth-callback?oauth_token&oauth_verifier
     │<─────────────────────────────────────────────────│
     │                │                │                │
     │───────────────>│                │                │
     │                │ getAccessToken │                │
     │                │───────────────>│                │
     │                │                │ oauth.getAccessToken
     │                │                │───────────────>│
     │                │                │                │
     │                │                │ accessToken    │
     │                │                │<───────────────│
     │                │                │                │
     │                │ tokens         │                │
     │                │<───────────────│                │
     │                │                │                │
     │                │ Store tokens in localStorage    │
     │                │ Validate via /oauth/identity    │
     │                │───────────────────────────────>│
     │                │                │                │
     │                │ Navigate to /collection         │
     │<───────────────│                │                │
```

---

## tRPC + Types FAQ

**Q: Do types from `@lionralfs/discogs-client` flow through tRPC to frontend?**

A: Yes! tRPC provides end-to-end type safety:

```typescript
// Server (oauth.ts)
getAccessToken: publicProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input }) => {
    const result = await oauth.getAccessToken(...)
    return {
      accessToken: result.accessToken,      // string
      accessTokenSecret: result.accessTokenSecret  // string
    }
  })

// Client (automatically inferred)
const { mutateAsync } = trpc.oauth.getAccessToken.useMutation()
const result = await mutateAsync({ ... })
// result.accessToken is typed as string
// result.accessTokenSecret is typed as string
```

No manual type definitions needed on the frontend - TypeScript infers everything.

**Q: Is tRPC complex to set up?**

A: For this use case (2 endpoints), it's minimal:

- 1 Vercel function file (~20 lines)
- 1 tRPC setup file (~30 lines)
- 1 OAuth router file (~50 lines)
- 1 React client file (~15 lines)

Total: ~115 lines of boilerplate for full type-safety.

---

## Security Checklist

- [ ] `DISCOGS_CONSUMER_SECRET` has NO `VITE_` prefix (server-only)
- [ ] Request token secret in sessionStorage (auto-clears)
- [ ] Access tokens in localStorage (persisted, user-scoped)
- [ ] No OAuth credentials in git history
- [ ] Callback URL validation (only accept from Discogs)

---

## Verification Checklist

**Phase 1-3 (Foundation - COMPLETE):**

- [x] Vercel preview deployment works
- [x] `/api/trpc/oauth.getRequestToken` returns authorization URL
- [x] TypeScript compiles without errors
- [x] ESLint passes
- [x] Click "Sign in" redirects to Discogs
- [x] OAuth callback exchanges tokens

**Phase 4 (Client Helper):**

- [x] `src/server/discogs-client.ts` compiles
- [x] ESLint passes

**Phase 5 (Identity + Auth Provider):**

- [ ] Complete OAuth flow: Login → Discogs → Callback → Collection
- [ ] Refresh page maintains auth (validates tokens via tRPC)
- [ ] Invalid tokens redirect to login
- [ ] Logout clears all tokens

**Phase 6 (User Profile):**

- [ ] User avatar displays correctly
- [ ] Gravatar email extracted from profile

**Phase 7 (Collection):**

- [ ] Collection page loads releases
- [ ] Pagination works
- [ ] Client-side filtering works (batch fetching)
- [ ] Server-side and client-side sorting works
- [ ] Rate limiting tracked correctly

**Phase 8 (Cleanup):**

- [ ] No PAT token references remain
- [ ] `bun run lint` passes
- [ ] `bun run build` succeeds

**Phase 9 (i18n):**

- [ ] English strings render correctly
- [ ] Norwegian strings render correctly

**Phase 10 (Tests):**

- [ ] `bun run test:run` passes
- [ ] CI pipeline green
