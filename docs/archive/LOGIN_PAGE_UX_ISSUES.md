# Login Page UX Issues

UX review conducted on the login page (`src/routes/login.tsx`).

## High Priority

### 1. No confirmation for "Use different account"

**Location:** `src/routes/login.tsx:130-134`

Clicking "Use different account" immediately wipes OAuth tokens and starts a new OAuth flow. If OAuth fails (network error, user cancels on Discogs, or accidental click), the user loses their previous session with no recovery path.

---

### 2. Errors only shown via transient toasts

**Location:** `src/routes/login.tsx:157-159`, `121-122`

OAuth errors are displayed only via toast notifications that auto-dismiss after a few seconds. There's no persistent inline error state, so users who miss the toast see no feedback and don't know something failed.

---

### 3. Public browse is non-functional

**Location:** `src/routes/login.tsx:166-177`

The public browse form accepts input and submits, but only shows a "Coming soon" toast. Users discover the feature doesn't work only after interacting with it.

---

## Medium Priority

### 4. Information hierarchy inverted

**Location:** `src/routes/login.tsx:275-277`

The supporting text "Connect your Discogs account" appears below the sign-in button instead of above it, inverting the natural reading order.

---

### 5. Missing form accessibility

**Location:** `src/routes/login.tsx:290-296`

The public browse input lacks an associated `<label>` element, making it inaccessible to screen readers.

---

### 6. Welcome back flow missing visual identity

**Location:** `src/routes/login.tsx:221-225`

The welcome back state shows only the username as text. No avatar or visual element for instant recognition.

---

### 7. No account creation guidance

**Location:** `src/routes/login.tsx:257-278`

Users without a Discogs account have no guidance on how to create one.

---

### 8. Generic error messages

**Location:** `src/locales/en/translation.json:51`

Error message "Failed to connect to Discogs. Please try again." provides no actionable guidance on what might have gone wrong or what to do next.

---

### 9. No OAuth transparency

**Location:** `src/routes/login.tsx:257-278`

No explanation that users will be redirected to Discogs or what data access is being requested. Privacy-conscious users may hesitate without understanding what they're authorizing.

---

## Low Priority

### 10. Theme/language toggles low discoverability

**Location:** `src/routes/login.tsx:187-190`

Icon-only buttons in the top-right corner with no tooltips or labels. First-time users may not notice them.

---

### 11. Missing skip link

**Location:** `src/routes/login.tsx:179`

No "skip to main content" link for keyboard users to bypass decorative elements.

---

### 12. No visual feedback on OAuth redirect

**Location:** `src/routes/login.tsx:156`

When clicking sign-in, users are redirected away with only a spinner. No indication they're leaving the site.

---

### 13. Excessive DOM in VinylShowcase

**Location:** `src/routes/login.tsx:47-55`

The vinyl showcase creates 10+ nested divs for decorative groove rings. This adds DOM complexity for a purely decorative element.
