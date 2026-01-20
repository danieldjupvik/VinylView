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
  Client still calls Discogs API directly (with OAuth headers)
  Server only handles token exchange (requires Consumer Secret)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)                       │
├─────────────────────────────────────────────────────────────────┤
│  Login Page          │  OAuth Callback      │  API Client       │
│  - OAuth button      │  - /oauth-callback   │  - OAuth headers  │
│  - Simple, one-click │  - Token exchange    │  - Same rate limit│
└──────────┬───────────┴──────────┬───────────┴─────────┬─────────┘
           │                      │                     │
           │    tRPC Client       │                     │
           │    (only for OAuth)  │                     │
           └──────────┬───────────┘                     │
                      │                                 │
┌─────────────────────▼─────────────────────────────────┼─────────┐
│                    Vercel Functions                    │         │
├────────────────────────────────────────────────────────┼─────────┤
│  /api/trpc/[trpc].ts                                  │         │
│  └── oauth router                                     │         │
│      ├── getRequestToken (uses Consumer Secret)       │         │
│      └── getAccessToken  (uses Consumer Secret)       │         │
│                                                        │         │
│  @lionralfs/discogs-client (server-side only)        │         │
└────────────────────────────────────────────────────────┼─────────┘
                                                         │
┌────────────────────────────────────────────────────────▼─────────┐
│                        Discogs API                               │
│  - /oauth/request_token  (via server)                            │
│  - /oauth/authorize      (user redirect)                         │
│  - /oauth/access_token   (via server)                            │
│  - All other endpoints   (direct from client with OAuth header)  │
└──────────────────────────────────────────────────────────────────┘
```

**Key point:** Only the OAuth token exchange goes through the server. All other API calls (collection, identity, etc.) still go directly from client to Discogs - just using OAuth headers instead of PAT.

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

| Phase | Description                   | Status |
| ----- | ----------------------------- | ------ |
| 1     | Serverless API Infrastructure | ✅     |
| 2     | OAuth Callback Route          | ✅     |
| 3     | Login Page Update             | ✅     |
| 4     | Storage Updates               | ⬜     |
| 5     | API Client Update             | ⬜     |
| 6     | Auth Provider Update          | ⬜     |
| 7     | i18n Updates                  | ⬜     |
| 8     | Cleanup                       | ⬜     |
| 9     | Tests                         | ⬜     |

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

### Phase 4: Storage Updates

**Goal:** Update storage layer for OAuth tokens.

**Changes to `src/lib/constants.ts`:**

```typescript
export const STORAGE_KEYS = {
  // Remove: TOKEN (was for PAT)
  OAUTH_ACCESS_TOKEN: 'vinyldeck_oauth_token',
  OAUTH_ACCESS_TOKEN_SECRET: 'vinyldeck_oauth_token_secret',
  USERNAME: 'vinyldeck_username'
  // ... rest unchanged
} as const

export const SESSION_STORAGE_KEYS = {
  REDIRECT_URL: 'vinyldeck_redirect_url',
  OAUTH_REQUEST_SECRET: 'vinyldeck_oauth_request_secret'
} as const
```

**Changes to `src/lib/storage.ts`:**

- Remove: `getToken()`, `setToken()`, `removeToken()`
- Add: `getOAuthTokens()`, `setOAuthTokens()`, `removeOAuthTokens()`
- Update: `clearAuth()` to use new functions

---

### Phase 5: API Client Update

**Goal:** Update Axios interceptor to use OAuth headers.

**Changes to `src/api/client.ts`:**

Replace PAT header:

```typescript
// Before
config.headers.Authorization = `Discogs token=${token}`

// After
config.headers.Authorization = generateOAuthHeader(
  accessToken,
  accessTokenSecret
)
```

**OAuth 1.0a header generation (PLAINTEXT method):**

```typescript
function generateOAuthHeader(
  accessToken: string,
  accessTokenSecret: string
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const signature = `&${accessTokenSecret}`

  return [
    `OAuth oauth_consumer_key="${CONSUMER_KEY}"`,
    `oauth_nonce="${nonce}"`,
    `oauth_token="${accessToken}"`,
    `oauth_signature="${encodeURIComponent(signature)}"`,
    `oauth_signature_method="PLAINTEXT"`,
    `oauth_timestamp="${timestamp}"`
  ].join(', ')
}
```

**Rate limiting:** Unchanged - still client-side, still uses response headers.

---

### Phase 6: Auth Provider Update

**Goal:** Update auth context for OAuth-only flow.

**Changes to `src/providers/auth-context.ts`:**

```typescript
export interface AuthContextValue extends AuthState {
  loginWithOAuth: (
    accessToken: string,
    accessTokenSecret: string
  ) => Promise<void>
  logout: () => void
  // Remove: login(username, token)
}
```

**Changes to `src/providers/auth-provider.tsx`:**

- Remove `login()` function
- Add `loginWithOAuth()` function
- Update initialization to check for OAuth tokens instead of PAT

---

### Phase 7: i18n Updates

**Goal:** Add/update translation strings.

**New keys:**

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

**Remove keys:** `auth.username`, `auth.token`, `auth.usernamePlaceholder`, `auth.tokenPlaceholder`

---

### Phase 8: Cleanup

**Goal:** Remove PAT-related code.

**Files to update:**

- `src/api/discogs.ts` - Remove any OAuth functions that were client-side (if any)
- `src/routes/login.tsx` - Ensure no PAT form remnants
- `src/lib/storage.ts` - Ensure no PAT functions remain
- `src/providers/auth-provider.tsx` - Ensure no PAT login logic

---

### Phase 9: Tests (Final)

**Goal:** Update existing tests and add OAuth tests.

**Test updates:**

- Mock tRPC client in tests
- Update auth provider tests for OAuth flow
- Update login page tests
- Add OAuth callback page tests

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

**Phase 1 (API):**

- [ ] Vercel preview deployment works
- [ ] `/api/trpc/oauth.getRequestToken` returns authorization URL
- [x] TypeScript compiles without errors
- [x] ESLint passes

**Phase 2-3 (Auth Flow):**

- [ ] Click "Sign in" redirects to Discogs
- [ ] Authorizing returns to app authenticated
- [ ] Denying shows error message
- [ ] Redirect URL preservation works

**Phase 4-6 (Integration):**

- [ ] Collection loads with OAuth auth
- [ ] Refresh page maintains auth
- [ ] Logout clears all tokens
- [ ] Rate limiting still works

**Phase 9 (Tests):**

- [ ] All existing tests pass
- [ ] New OAuth tests pass
- [ ] CI pipeline green
