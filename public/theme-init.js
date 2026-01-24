/**
 * FOUC Prevention: Apply theme before React loads.
 * This script runs synchronously in <head> to prevent flash of wrong theme.
 * IMPORTANT: Keep default ('dark') in sync with THEME.DEFAULT in src/lib/constants.ts
 */
try {
  var theme = localStorage.getItem('vinyldeck-theme') || 'dark'
  var effectiveTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme
  document.documentElement.classList.add(effectiveTheme)
} catch (e) {
  // Ignore storage errors in private browsing
}
