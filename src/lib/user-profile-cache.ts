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
import type { DiscogsUserProfile } from '@/types/discogs'

export function getStoredUserProfile(): DiscogsUserProfile | null {
  try {
    const stored = localStorage.getItem('vinyldeck_user_profile')
    return stored ? (JSON.parse(stored) as DiscogsUserProfile) : null
  } catch {
    return null
  }
}

export function setStoredUserProfile(profile: DiscogsUserProfile): void {
  try {
    localStorage.setItem('vinyldeck_user_profile', JSON.stringify(profile))
  } catch {
    // Ignore storage errors
  }
}
