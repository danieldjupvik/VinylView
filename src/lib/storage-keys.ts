// src/lib/storage-keys.ts
/**
 * Consolidated storage key constants for VinylDeck.
 * All storage keys should be defined here for consistency.
 */
export const STORAGE_KEYS = {
  /** localStorage (via Zustand): OAuth tokens, session state, username, userId, cachedProfile */
  AUTH: 'vinyldeck-auth',
  /** localStorage (via Zustand): viewMode, avatarSource, gravatarEmail */
  PREFERENCES: 'vinyldeck-prefs',
  /** localStorage (via next-themes): theme preference (light/dark/system) */
  THEME: 'vinyldeck-theme',
  /** localStorage (via i18next): language preference */
  LANGUAGE: 'vinyldeck-language'
} as const

/**
 * IndexedDB keys for large data storage.
 */
export const IDB_KEYS = {
  /** TanStack Query cache persistence */
  QUERY_CACHE: 'vinyldeck-query-cache'
} as const

/**
 * Session storage keys for temporary OAuth flow state.
 */
export const SESSION_KEYS = {
  /** Temporary OAuth request token during authorization */
  OAUTH_REQUEST: 'vinyldeck-oauth-request',
  /** Temporary OAuth request token secret during authorization */
  OAUTH_REQUEST_SECRET: 'vinyldeck-oauth-request-secret',
  /** Post-login redirect URL preservation */
  REDIRECT_URL: 'vinyldeck-redirect'
} as const
