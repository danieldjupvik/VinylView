// src/lib/user-profile-cache.ts
// Temporary: Will be replaced with TanStack Query cache in future
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
