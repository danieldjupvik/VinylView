// src/lib/user-profile-cache.ts
/**
 * User profile cache for "Welcome back" login flow.
 *
 * Stores user profile in localStorage to show avatar/username immediately
 * on the login page when user returns (before re-authentication).
 *
 * Note: TanStack Query also caches profile data, but this localStorage
 * cache persists across sessions for the "Welcome back" UX.
 */
import { STORAGE_KEYS } from '@/lib/storage-keys'
import type { DiscogsUserProfile } from '@/types/discogs'

/**
 * Validates that parsed JSON has required DiscogsUserProfile fields.
 */
function isValidUserProfile(data: unknown): data is DiscogsUserProfile {
  if (typeof data !== 'object' || data === null) return false
  const obj = data as Record<string, unknown>
  return typeof obj['id'] === 'number' && typeof obj['username'] === 'string'
}

export function getStoredUserProfile(): DiscogsUserProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE)
    if (!stored) return null
    const parsed: unknown = JSON.parse(stored)
    return isValidUserProfile(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Stores user profile in localStorage for "Welcome back" flow.
 *
 * Note on email storage: The email field is intentionally stored to
 * auto-initialize the Gravatar email preference when users first log in
 * (see auth-provider.tsx). This provides a better UX for users who want
 * to use their Discogs email for Gravatar. The email is only visible to
 * the user themselves (never shared) and can be cleared by disconnecting
 * the Discogs account.
 *
 * @param profile - User profile from Discogs API
 */
export function setStoredUserProfile(profile: DiscogsUserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile))
  } catch {
    // Ignore storage errors
  }
}

export function clearStoredUserProfile(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE)
  } catch {
    // Ignore storage errors
  }
}
