# Login Page UX Improvements Plan

This plan addresses UX issues identified in `LOGIN_PAGE_UX_ISSUES.md`.

## Implementation Workflow

> **Important**: Implement one phase at a time. After completing each phase, pause for user verification before proceeding to the next phase. Do not batch multiple phases together.

1. Complete all issues in **Phase 1**
2. Run lint and build checks
3. **STOP** - User verifies changes on mobile, tablet, and desktop
4. User approves → Proceed to **Phase 2**
5. Repeat for each subsequent phase

## Design Principles

- **Follow shadcn/ui patterns** - Use existing component APIs, styling conventions, and composition patterns
- **Mobile-first responsive design** - All new elements must look perfect on mobile, tablet, and desktop
- **Accessibility** - WCAG compliant, screen reader friendly, keyboard navigable
- **Minimal changes** - Avoid over-engineering; keep solutions focused and simple

---

## Progress

| #   | Issue                                    | Priority | Status     |
| --- | ---------------------------------------- | -------- | ---------- |
| 1   | Confirmation for "Use different account" | High     | ✅ Done    |
| 2   | Inline error state (not just toasts)     | High     | ✅ Done    |
| 3   | Disable non-functional public browse     | High     | ✅ Done    |
| 4   | Fix information hierarchy                | Medium   | ✅ Done    |
| 5   | Add form accessibility (label)           | Medium   | ✅ Done    |
| 6   | Avatar in welcome back flow              | Medium   | ✅ Done    |
| 7   | Account creation guidance                | Medium   | ✅ Done    |
| 8   | Improve error messages                   | Medium   | ✅ Done    |
| 9   | OAuth transparency                       | Medium   | ✅ Done    |
| 10  | Skip link for keyboard users             | Low      | ⏭️ Skipped |
| 11  | Visual feedback on OAuth redirect        | Low      | ✅ Done    |

### Experimental Phase

| #   | Issue                    | Priority     | Status  |
| --- | ------------------------ | ------------ | ------- |
| 12  | Reduce VinylShowcase DOM | Experimental | ✅ Done |

**Note**: Issue 12 uses CSS box-shadow for groove rings instead of 9 separate div elements. Requires visual verification in both light and dark modes.

**Skipped**:

- Tooltips for theme/language toggles - icons (sun/moon, globe) are universally understood
- Skip link for keyboard users - not working properly and low value for this page

---

## Files to Modify

- `src/routes/login.tsx` - Main login page component
- `src/locales/en/translation.json` - English translations
- `src/locales/no/translation.json` - Norwegian translations

---

## Phase 1: High Priority Issues

### Issue 1: Confirmation Dialog for "Use different account"

**Problem**: Clicking "Use different account" immediately wipes OAuth tokens with no recovery.

**Solution**: Add AlertDialog confirmation (same pattern as `settings.tsx` disconnect dialog).

**Responsive considerations**: AlertDialog is already responsive via shadcn - centers on mobile, proper padding.

**Implementation**:

1. Import AlertDialog components from `@/components/ui/alert-dialog`
2. Add state: `const [showSwitchDialog, setShowSwitchDialog] = useState(false)`
3. Wrap the "Use different account" button in AlertDialog:

```tsx
<AlertDialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
  <AlertDialogTrigger asChild>
    <Button
      variant="outline"
      className="w-full"
      disabled={isValidating || isLoading}
    >
      {t('auth.useDifferentAccount')}
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>{t('auth.switchAccount.title')}</AlertDialogTitle>
      <AlertDialogDescription>
        {t('auth.switchAccount.description')}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleUseDifferentAccount}
        className="bg-destructive hover:bg-destructive/90 text-white"
      >
        {t('auth.switchAccount.confirm')}
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**New translations** (EN):

```json
"auth.switchAccount": {
  "title": "Switch account?",
  "description": "This will disconnect your current Discogs account. You'll need to sign in again with a different account.",
  "confirm": "Switch account"
}
```

**New translations** (NO):

```json
"auth.switchAccount": {
  "title": "Bytte konto?",
  "description": "Dette vil koble fra din nåværende Discogs-konto. Du må logge inn igjen med en annen konto.",
  "confirm": "Bytt konto"
}
```

---

### Issue 2: Inline Error State

**Problem**: Errors only shown via transient toasts that auto-dismiss.

**Solution**: Add persistent inline error display above action buttons. Keep toast as secondary feedback for accessibility.

**Responsive considerations**: Error message should wrap properly on narrow screens; icon stays aligned.

**Implementation**:

1. Import `AlertCircle` from `lucide-react`
2. Add state: `const [error, setError] = useState<string | null>(null)`
3. Add inline error component before the login actions:

```tsx
{
  error && (
    <div
      role="alert"
      className="animate-in fade-in slide-in-from-top-1 border-destructive/50 bg-destructive/10 text-destructive flex items-start gap-3 rounded-lg border p-3 text-sm duration-200"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  )
}
```

4. Update handlers:
   - Clear error at start: `setError(null)`
   - Set error in catch: `setError(t('auth.oauthError'))` or `setError(t('auth.oauthSessionExpired'))`
5. Keep existing toast calls for screen reader announcements

---

### Issue 3: Disable Non-functional Public Browse

**Problem**: Users discover feature doesn't work only after submitting.

**Solution**: Make it visually clear the feature is coming soon BEFORE interaction.

**Responsive considerations**: Badge should fit on same line on mobile; reduced opacity applies to entire section.

**Implementation**:

1. Add "Coming soon" badge inline with the title
2. Disable input and button permanently
3. Apply reduced opacity to entire section
4. Remove form submit handler and related state

```tsx
<div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards border-border border-t pt-8 delay-900 duration-500">
  <p className="text-muted-foreground mb-4 text-center text-sm">
    {t('login.publicBrowse.title')}
    <span className="text-muted-foreground/60 ml-2 text-xs">
      {t('common.comingSoon')}
    </span>
  </p>
  <div className="mx-auto flex max-w-xs gap-2 opacity-50">
    <Label htmlFor="public-browse-username" className="sr-only">
      {t('login.publicBrowse.placeholder')}
    </Label>
    <Input
      id="public-browse-username"
      type="text"
      placeholder={t('login.publicBrowse.placeholder')}
      className="flex-1"
      disabled
      aria-disabled="true"
    />
    <Button type="button" variant="outline" disabled>
      {t('login.publicBrowse.button')}
    </Button>
  </div>
</div>
```

5. Remove unused state and handlers:
   - Remove `publicUsername` state
   - Remove `isBrowsingLoading` state
   - Remove `handlePublicBrowse` function

---

## Phase 2: Medium Priority Issues

### Issue 4: Fix Information Hierarchy

**Problem**: "Connect your Discogs account" appears below button instead of above.

**Solution**: Move supporting text above the sign-in button for natural reading order.

**Responsive considerations**: Text wraps naturally; spacing via `space-y-4` class.

**Implementation** (fresh login section):

```tsx
<div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards space-y-4 delay-800 duration-500">
  <p className="text-muted-foreground text-center text-sm">
    {t('login.connectAccount')}
  </p>
  <Button
    onClick={() => void handleOAuthLogin()}
    className="w-full"
    size="lg"
    disabled={isLoading}
  >
    {isLoading ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {t('auth.redirecting')}
      </>
    ) : (
      t('auth.signInWithDiscogs')
    )}
  </Button>
</div>
```

---

### Issue 5: Add Form Accessibility

**Problem**: Public browse input lacks associated `<label>`.

**Solution**: Add visually hidden label for screen readers.

**Implementation**: (Already included in Issue 3 implementation above)

1. Import `Label` from `@/components/ui/label`
2. Add sr-only label before input

---

### Issue 6: Avatar in Welcome Back Flow

**Problem**: Welcome back shows only username text, no visual identity.

**Solution**: Display cached avatar above the welcome message.

**Responsive considerations**: Avatar size works well on all screens at 64px (h-16 w-16).

**Implementation**:

1. Import `Avatar, AvatarImage, AvatarFallback` from `@/components/ui/avatar`
2. Import `getStoredUserProfile` from `@/lib/storage`
3. Get cached profile and calculate initials:

```tsx
const storedProfile = getStoredUserProfile()
const initials = storedUsername ? storedUsername.slice(0, 2).toUpperCase() : '?'
```

4. Replace the welcome text with avatar + text:

```tsx
<div className="mb-4 flex flex-col items-center gap-3">
  <Avatar className="border-border h-16 w-16 border-2">
    {storedProfile?.avatarUrl && (
      <AvatarImage src={storedProfile.avatarUrl} alt={storedUsername ?? ''} />
    )}
    <AvatarFallback className="text-lg font-medium">{initials}</AvatarFallback>
  </Avatar>
  <p className="text-lg font-medium">
    {t('auth.welcomeBack', { username: storedUsername })}
  </p>
</div>
```

---

### Issue 7: Account Creation Guidance

**Problem**: No help for users without a Discogs account.

**Solution**: Add "Create account" link below the sign-in section.

**Responsive considerations**: Text wraps naturally on narrow screens.

**Implementation** (add after the sign-in button in fresh login flow):

```tsx
<p className="text-muted-foreground text-center text-xs">
  {t('login.noAccount')}{' '}
  <a
    href="https://www.discogs.com/users/create"
    target="_blank"
    rel="noopener noreferrer"
    className="text-primary underline-offset-4 hover:underline"
  >
    {t('login.createAccount')}
  </a>
</p>
```

**New translations** (EN):

```json
"login": {
  "noAccount": "Don't have an account?",
  "createAccount": "Create one on Discogs"
}
```

**New translations** (NO):

```json
"login": {
  "noAccount": "Har du ikke en konto?",
  "createAccount": "Opprett en på Discogs"
}
```

---

### Issue 8: Improve Error Messages

**Problem**: Generic "Failed to connect to Discogs. Please try again."

**Solution**: More specific, actionable messages.

**Updated translations** (EN):

```json
"auth": {
  "oauthError": "Could not connect to Discogs. Check your internet connection and try again.",
  "oauthSessionExpired": "Your previous session expired. Please sign in again."
}
```

**Updated translations** (NO):

```json
"auth": {
  "oauthError": "Kunne ikke koble til Discogs. Sjekk internettforbindelsen din og prøv igjen.",
  "oauthSessionExpired": "Din forrige økt utløp. Vennligst logg inn igjen."
}
```

---

### Issue 9: OAuth Transparency

**Problem**: No explanation of redirect or data access.

**Solution**: Add brief note about OAuth flow below "Connect your Discogs account".

**Responsive considerations**: Text wraps naturally; small font size (text-xs) works on all screens.

**Implementation** (add in fresh login section, below the "Connect your Discogs account" text):

```tsx
<div className="space-y-1 text-center">
  <p className="text-muted-foreground text-sm">{t('login.connectAccount')}</p>
  <p className="text-muted-foreground/70 text-xs">{t('login.oauthNote')}</p>
</div>
```

**New translations** (EN):

```json
"login": {
  "oauthNote": "You'll be redirected to Discogs to authorize read-only access to your collection."
}
```

**New translations** (NO):

```json
"login": {
  "oauthNote": "Du blir omdirigert til Discogs for å gi lesetilgang til samlingen din."
}
```

---

## Phase 3: Low Priority Issues

### Issue 10: Skip Link for Keyboard Users

**Problem**: No way for keyboard users to bypass decorative elements.

**Solution**: Add visually-hidden skip link that appears on focus.

**Responsive considerations**: Skip link appears in top-left on all screen sizes when focused.

**Implementation**: Add as first element inside the page container:

```tsx
<a
  href="#main-content"
  className="focus:bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:ring-2"
>
  {t('login.skipToContent')}
</a>
```

Add `id="main-content"` to the Card component:

```tsx
<Card id="main-content" className="...">
```

**New translations** (EN):

```json
"login": {
  "skipToContent": "Skip to login"
}
```

**New translations** (NO):

```json
"login": {
  "skipToContent": "Hopp til innlogging"
}
```

---

### Issue 11: Visual Feedback on OAuth Redirect

**Problem**: Just a spinner, no indication user is leaving the site.

**Solution**: Add a secondary hint below the button during loading.

**Responsive considerations**: Centered text works on all screens.

**Implementation** (add after the sign-in button, only visible when loading):

```tsx
{
  isLoading && (
    <p className="text-muted-foreground animate-pulse text-center text-xs">
      {t('login.redirectingHint')}
    </p>
  )
}
```

**New translations** (EN):

```json
"login": {
  "redirectingHint": "You'll return here after authorizing"
}
```

**New translations** (NO):

```json
"login": {
  "redirectingHint": "Du kommer tilbake hit etter autorisering"
}
```

---

## Experimental Phase: VinylShowcase DOM Optimization

> **Implement in a separate PR** - This change affects decorative visuals and has risk of regression.

### Issue 12: Reduce VinylShowcase DOM Complexity

**Problem**: 10+ nested divs for decorative groove rings.

**Solution**: Use CSS box-shadow for groove rings instead of DOM elements.

**Risk**: Visual differences between current implementation and box-shadow approach, especially in dark mode.

**Implementation**:

```tsx
function VinylShowcase(): React.JSX.Element {
  return (
    <div className="relative" aria-hidden="true">
      <div className="relative h-80 w-80 xl:h-96 xl:w-96">
        <div className="animate-vinyl-spin-slow absolute inset-0">
          {/* Vinyl body with groove rings via box-shadow */}
          <div
            className="dark:from-foreground/25 dark:to-foreground/10 absolute inset-0 rounded-full bg-gradient-to-br from-zinc-900 to-zinc-800"
            style={{
              boxShadow: `
                inset 0 0 0 16px transparent,
                inset 0 0 0 17px rgba(82, 82, 91, 0.4),
                inset 0 0 0 24px transparent,
                inset 0 0 0 25px rgba(113, 113, 122, 0.3),
                inset 0 0 0 32px transparent,
                inset 0 0 0 33px rgba(82, 82, 91, 0.4),
                inset 0 0 0 40px transparent,
                inset 0 0 0 41px rgba(113, 113, 122, 0.3),
                inset 0 0 0 48px transparent,
                inset 0 0 0 49px rgba(82, 82, 91, 0.4),
                inset 0 0 0 56px transparent,
                inset 0 0 0 57px rgba(113, 113, 122, 0.3),
                inset 0 0 0 64px transparent,
                inset 0 0 0 65px rgba(82, 82, 91, 0.4),
                inset 0 0 0 80px transparent,
                inset 0 0 0 81px rgba(113, 113, 122, 0.3),
                inset 0 0 0 96px transparent,
                inset 0 0 0 97px rgba(82, 82, 91, 0.4)
              `
            }}
          />
          {/* Center label */}
          <div className="from-primary/50 to-primary/30 absolute inset-[35%] rounded-full bg-gradient-to-br" />
          {/* Small vinyl icon */}
          <div className="absolute top-[39%] left-1/2 -translate-x-1/2">
            <svg
              viewBox="0 0 24 24"
              className="dark:text-primary-foreground/90 h-3 w-3 text-zinc-900 xl:h-4 xl:w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 5c3.87 0 7 3.13 7 7" strokeLinecap="round" />
            </svg>
          </div>
          {/* RPM text */}
          <span className="dark:text-primary-foreground/90 absolute bottom-[39%] left-1/2 -translate-x-1/2 text-[10px] font-medium text-zinc-900 xl:text-xs">
            {'33⅓'}
          </span>
          {/* Center hole */}
          <div className="bg-background/90 absolute inset-[47%] rounded-full" />
        </div>
      </div>
    </div>
  )
}
```

**Testing required**:

- [ ] Compare visuals side-by-side with current implementation
- [ ] Test in light mode and dark mode
- [ ] Verify animation still works smoothly
- [ ] Check on different screen sizes (xl breakpoint changes size)

---

## New Translation Keys Summary

### English (`src/locales/en/translation.json`)

Add these keys:

```json
{
  "login": {
    "noAccount": "Don't have an account?",
    "createAccount": "Create one on Discogs",
    "oauthNote": "You'll be redirected to Discogs to authorize read-only access to your collection.",
    "skipToContent": "Skip to login",
    "redirectingHint": "You'll return here after authorizing"
  },
  "auth": {
    "switchAccount": {
      "title": "Switch account?",
      "description": "This will disconnect your current Discogs account. You'll need to sign in again with a different account.",
      "confirm": "Switch account"
    }
  }
}
```

Update these existing keys:

```json
{
  "auth": {
    "oauthError": "Could not connect to Discogs. Check your internet connection and try again.",
    "oauthSessionExpired": "Your previous session expired. Please sign in again."
  }
}
```

### Norwegian (`src/locales/no/translation.json`)

Add these keys:

```json
{
  "login": {
    "noAccount": "Har du ikke en konto?",
    "createAccount": "Opprett en på Discogs",
    "oauthNote": "Du blir omdirigert til Discogs for å gi lesetilgang til samlingen din.",
    "skipToContent": "Hopp til innlogging",
    "redirectingHint": "Du kommer tilbake hit etter autorisering"
  },
  "auth": {
    "switchAccount": {
      "title": "Bytte konto?",
      "description": "Dette vil koble fra din nåværende Discogs-konto. Du må logge inn igjen med en annen konto.",
      "confirm": "Bytt konto"
    }
  }
}
```

Update these existing keys:

```json
{
  "auth": {
    "oauthError": "Kunne ikke koble til Discogs. Sjekk internettforbindelsen din og prøv igjen.",
    "oauthSessionExpired": "Din forrige økt utløp. Vennligst logg inn igjen."
  }
}
```

---

## Verification Checklist

After implementation, verify on **mobile, tablet, and desktop**:

### Phase 1 (High Priority)

- [ ] Confirmation dialog appears when clicking "Use different account"
- [ ] Dialog buttons are properly spaced and styled (destructive red for confirm)
- [ ] Inline error appears and persists after OAuth failure
- [ ] Error message wraps properly on narrow screens
- [ ] Public browse section shows "Coming soon" badge and is disabled
- [ ] Disabled state is clearly visible (opacity reduced)

### Phase 2 (Medium Priority)

- [ ] "Connect your Discogs account" text appears above the sign-in button
- [ ] OAuth note appears below it in smaller text
- [ ] Screen reader announces public browse input correctly
- [ ] Avatar displays in welcome back flow (when cached profile exists)
- [ ] Avatar fallback shows initials correctly
- [ ] "Create account" link opens Discogs registration in new tab
- [ ] Error messages are helpful and actionable (both languages)

### Phase 3 (Low Priority)

- [ ] Skip link appears on keyboard Tab press
- [ ] Skip link navigates to main content
- [ ] Redirect hint text appears below button during loading

### General

- [ ] All translations work in both English and Norwegian
- [ ] Run `bun run lint` - no errors
- [ ] Run `vercel build` - builds successfully
- [ ] Test on iPhone (Safari) and Android (Chrome)
- [ ] Test on iPad (landscape and portrait)
- [ ] Test on desktop (various window sizes)
