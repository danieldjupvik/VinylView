# Plan: Preserve URL After Login (sessionStorage Approach)

## Problem Summary

When a user is redirected to login (either from accessing a protected route while unauthenticated, or after logging out), they should return to their previous location after logging back in.

**Two scenarios:**

1. **Unauthenticated access**: Visit `/collection?style=Conscious` → redirect to `/login` → login → land on `/collection?style=Conscious`
2. **Logout/re-login**: Be on `/collection?style=Conscious` → logout → login again → return to `/collection?style=Conscious`

---

## Design Decision: sessionStorage vs URL Parameters

| Approach                      | Pros                                                           | Cons                                        |
| ----------------------------- | -------------------------------------------------------------- | ------------------------------------------- |
| URL params (`?redirect=...`)  | Survives page refresh, stateless                               | Ugly URLs, visible to user                  |
| **sessionStorage** (chosen) ✓ | Clean URLs, survives OAuth redirect, automatic session cleanup | Lost if tab closes (acceptable for this UX) |

**Why sessionStorage:**

- No ugly encoded URLs in the address bar
- Persists through OAuth external redirects (same tab)
- Automatically clears when tab/session ends (matches "same session" requirement)
- Still requires security validation

---

## Implementation Plan

### 1. Add Storage Key for Redirect URL (constants.ts)

**File**: `/src/lib/constants.ts`

Add new session storage key:

```typescript
export const SESSION_STORAGE_KEYS = {
  REDIRECT_URL: 'vinyldeck_redirect_url'
} as const
```

---

### 2. Create Redirect URL Utilities (new file)

**File**: `/src/lib/redirect-utils.ts`

Create utility functions for sessionStorage-based redirect handling:

```typescript
/**
 * Stores the current URL (path + query params) for post-login redirect.
 */
export function storeRedirectUrl(url: string): void

/**
 * Retrieves and clears the stored redirect URL.
 * Returns null if no URL stored or if validation fails.
 */
export function getAndClearRedirectUrl(): string | null

/**
 * Validates redirect URL to prevent open redirect attacks.
 * Only allows internal paths starting with "/".
 */
export function isValidRedirectUrl(url: string): boolean
```

**Security validations in `isValidRedirectUrl`:**

- Must start with `/` (internal paths only)
- Block `//` (protocol-relative URLs)
- Block paths starting with `/login` (prevent redirect loops)
- Block backslashes `\` (browser confusion attacks)

---

### 3. Update Auth Guard (\_authenticated.tsx)

**File**: `/src/routes/_authenticated.tsx`

**Current** (line 25-28):

```typescript
if (!isLoading && !isAuthenticated) {
  void navigate({ to: '/login' })
}
```

**Change to**:

```typescript
import { useRouterState } from '@tanstack/react-router'
import { storeRedirectUrl } from '@/lib/redirect-utils'

// Inside component:
const location = useRouterState({ select: (s) => s.location })

useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    // Store current URL (path + search params) before redirecting
    const currentUrl = location.pathname + location.search
    storeRedirectUrl(currentUrl)
    void navigate({ to: '/login' })
  }
}, [isAuthenticated, isLoading, navigate, location])
```

---

### 4. Update Logout Handler (sidebar-user.tsx)

**File**: `/src/components/layout/sidebar-user.tsx`

**Current** (line 27-31):

```typescript
const handleLogout = () => {
  void logout()
  toast.success(t('auth.logoutSuccess'))
  void navigate({ to: '/login' })
}
```

**Change to**:

```typescript
import { useRouterState } from '@tanstack/react-router'
import { storeRedirectUrl } from '@/lib/redirect-utils'

// Inside component:
const location = useRouterState({ select: (s) => s.location })

const handleLogout = () => {
  // Store current URL before logging out
  const currentUrl = location.pathname + location.search
  storeRedirectUrl(currentUrl)

  void logout()
  toast.success(t('auth.logoutSuccess'))
  void navigate({ to: '/login' })
}
```

---

### 5. Update Login Page (login.tsx)

**File**: `/src/routes/login.tsx`

**Changes:**

1. Import redirect utility:

   ```typescript
   import { getAndClearRedirectUrl } from '@/lib/redirect-utils'
   ```

2. Update the redirect after login (line 54):

   ```typescript
   // Current:
   void navigate({ to: '/collection' })

   // Change to:
   const redirectUrl = getAndClearRedirectUrl() ?? '/collection'
   void navigate({ to: redirectUrl })
   ```

3. Update the already-authenticated redirect (line 38):

   ```typescript
   // Current:
   void navigate({ to: '/collection' })

   // Change to:
   const redirectUrl = getAndClearRedirectUrl() ?? '/collection'
   void navigate({ to: redirectUrl })
   ```

---

### 6. Add Tests

**New file**: `/src/__tests__/lib/redirect-utils.test.ts`

Test cases for `redirect-utils.ts`:

- `storeRedirectUrl` stores URL in sessionStorage
- `getAndClearRedirectUrl` retrieves and clears URL
- `getAndClearRedirectUrl` returns null when no URL stored
- `isValidRedirectUrl` accepts valid internal paths (`/settings`, `/collection?style=Rock`)
- `isValidRedirectUrl` rejects external URLs (`https://evil.com`)
- `isValidRedirectUrl` rejects protocol-relative URLs (`//evil.com`)
- `isValidRedirectUrl` rejects login paths (`/login`, `/login?foo=bar`)
- `isValidRedirectUrl` rejects backslash URLs (`\evil.com`)

**Update**: `/src/__tests__/integration/auth-flow.test.tsx` (if exists)

- Add test: unauthenticated visit to protected route → login → returns to original URL with query params

---

## Files to Modify

| File                                        | Action                                |
| ------------------------------------------- | ------------------------------------- |
| `/src/lib/constants.ts`                     | Add `SESSION_STORAGE_KEYS`            |
| `/src/lib/redirect-utils.ts`                | **Create** - sessionStorage utilities |
| `/src/routes/_authenticated.tsx`            | Store URL before redirect to login    |
| `/src/components/layout/sidebar-user.tsx`   | Store URL before logout               |
| `/src/routes/login.tsx`                     | Read redirect URL after login         |
| `/src/__tests__/lib/redirect-utils.test.ts` | **Create** - Unit tests               |

---

## Implementation Order

1. `constants.ts` - Add session storage key
2. `redirect-utils.ts` - Create utilities with security validation
3. `_authenticated.tsx` - Store URL on auth guard redirect
4. `sidebar-user.tsx` - Store URL on logout
5. `login.tsx` - Use redirect URL after login
6. Tests

---

## OAuth Compatibility

The sessionStorage approach is fully OAuth-compatible:

1. User on `/collection?style=Rock` clicks login (or is redirected by auth guard)
2. `storeRedirectUrl('/collection?style=Rock')` saves to sessionStorage
3. OAuth redirects to Discogs external site
4. Discogs redirects back to app callback
5. After successful auth, `getAndClearRedirectUrl()` returns `/collection?style=Rock`
6. User lands on their original page

sessionStorage persists across same-origin navigations within a tab, including external OAuth redirects.

---

## Verification

1. **Unauthenticated access**:
   - Visit `/collection?style=Conscious` while logged out
   - Should redirect to `/login` (clean URL, no query params)
   - After login, should land on `/collection?style=Conscious`

2. **Logout/re-login** (with query params):
   - Be on `/collection?style=Conscious`, click logout
   - Should redirect to `/login` (clean URL)
   - Login again
   - Should land on `/collection?style=Conscious`

3. **Logout/re-login** (different page):
   - Be on `/settings`, click logout
   - Should redirect to `/login` (clean URL)
   - Login again
   - Should land on `/settings`

4. **Security**:
   - Manually set sessionStorage to `https://evil.com`
   - After login, should redirect to `/collection` (default), not evil.com

5. **Tests**: `bun run test:run` should pass
