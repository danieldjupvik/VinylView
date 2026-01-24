// src/lib/storage-keys.ts
/**
 * Consolidated storage key constants for VinylDeck.
 * All storage keys should be defined here for consistency.
 */
export const STORAGE_KEYS = {
  /** Zustand: OAuth tokens, session state, username, userId */
  AUTH: 'vinyldeck-auth',
  /** Zustand: viewMode, avatarSource, gravatarEmail */
  PREFERENCES: 'vinyldeck-prefs',
  /** next-themes: theme preference (light/dark/system) */
  THEME: 'vinyldeck-theme',
  /** i18next: language preference */
  LANGUAGE: 'vinyldeck-language',
  /** User profile cache for "Welcome back" flow */
  USER_PROFILE: 'vinyldeck-user-profile'
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
