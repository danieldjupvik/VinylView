/**
 * Custom error for offline state without cached profile.
 * Thrown when user tries to continue session while offline
 * but has no cached profile data to work with.
 */
export class OfflineNoCacheError extends Error {
  constructor() {
    super('Cannot continue offline without cached profile')
    this.name = 'OfflineNoCacheError'
  }
}
