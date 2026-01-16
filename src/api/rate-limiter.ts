import { RATE_LIMIT } from '@/lib/constants'

interface RateLimitState {
  limit: number
  used: number
  remaining: number
  lastUpdated: number
}

class RateLimiter {
  private state: RateLimitState = {
    limit: RATE_LIMIT.MAX_REQUESTS,
    used: 0,
    remaining: RATE_LIMIT.MAX_REQUESTS,
    lastUpdated: Date.now()
  }

  private waitPromise: Promise<void> | null = null

  /**
   * Update rate limit state from response headers
   */
  updateFromHeaders(headers: Record<string, string>): void {
    const limit = headers['x-discogs-ratelimit']
    const used = headers['x-discogs-ratelimit-used']
    const remaining = headers['x-discogs-ratelimit-remaining']

    if (limit) this.state.limit = parseInt(limit, 10)
    if (used) this.state.used = parseInt(used, 10)
    if (remaining) this.state.remaining = parseInt(remaining, 10)
    this.state.lastUpdated = Date.now()
  }

  /**
   * Check if we should throttle requests
   */
  shouldThrottle(): boolean {
    // Reset if window has passed
    if (Date.now() - this.state.lastUpdated > RATE_LIMIT.WINDOW_MS) {
      this.state.remaining = this.state.limit
      this.state.used = 0
      return false
    }

    return this.state.remaining < RATE_LIMIT.BUFFER
  }

  /**
   * Get time to wait before next request (in ms)
   */
  getWaitTime(): number {
    if (!this.shouldThrottle()) return 0

    const elapsed = Date.now() - this.state.lastUpdated
    const waitTime = RATE_LIMIT.WINDOW_MS - elapsed

    return Math.max(0, waitTime)
  }

  /**
   * Wait if rate limited, ensuring only one wait at a time
   */
  async waitIfNeeded(): Promise<void> {
    if (!this.shouldThrottle()) return

    // If already waiting, return the existing promise
    if (this.waitPromise) {
      return this.waitPromise
    }

    const waitTime = this.getWaitTime()
    if (waitTime <= 0) return

    this.waitPromise = new Promise((resolve) => {
      setTimeout(() => {
        this.waitPromise = null
        resolve()
      }, waitTime)
    })

    return this.waitPromise
  }

  /**
   * Get current rate limit state (for debugging/display)
   */
  getState(): Readonly<RateLimitState> {
    return { ...this.state }
  }
}

export const rateLimiter = new RateLimiter()
