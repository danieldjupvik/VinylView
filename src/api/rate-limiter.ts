/**
 * Discogs API Rate Limiter
 *
 * Requests are throttled by the server by source IP to 60 per minute for authenticated requests,
 * and 25 per minute for unauthenticated requests, with some exceptions.
 *
 * Your application should identify itself to our servers via a unique user agent string
 * in order to achieve the maximum number of requests per minute.
 *
 * Our rate limiting tracks your requests using a moving average over a 60 second window.
 * If no requests are made in 60 seconds, your window will reset.
 *
 * We attach the following headers to responses to help you track your rate limit use:
 *
 * X-Discogs-Ratelimit: The total number of requests you can make in a one minute window.
 *
 * X-Discogs-Ratelimit-Used : The number of requests you’ve made in your existing rate limit window.
 *
 * X-Discogs-Ratelimit-Remaining: The number of remaining requests you are able to make in the existing rate limit window.
 *
 * Your application should take our global limit into account and throttle its requests locally.
 */
import { RATE_LIMIT } from '@/lib/constants'

interface RateLimitState {
  /** Total requests allowed per minute */
  limit: number
  /** Number of requests used in current window */
  used: number
  /** Number of requests remaining in current window */
  remaining: number
  /** Timestamp of last rate limit update */
  lastUpdated: number
}

class RateLimiter {
  private state: RateLimitState = {
    limit: RATE_LIMIT.MAX_REQUESTS,
    used: 0,
    remaining: RATE_LIMIT.MAX_REQUESTS,
    lastUpdated: Date.now()
  }

  private inFlight = 0
  private waitPromise: Promise<void> | null = null

  private resetWindowIfExpired(): boolean {
    if (Date.now() - this.state.lastUpdated <= RATE_LIMIT.WINDOW_MS) {
      return false
    }

    this.state.remaining = this.state.limit
    this.state.used = 0
    this.state.lastUpdated = Date.now()
    this.inFlight = 0
    return true
  }

  /**
   * Update rate limit state from tRPC response rateLimit object.
   * Used when API calls go through the server via tRPC.
   */
  updateFromRateLimit(rateLimit: {
    limit?: number
    used?: number
    remaining?: number
  }): void {
    let updated = false

    if (rateLimit.limit !== undefined && Number.isFinite(rateLimit.limit)) {
      this.state.limit = rateLimit.limit
      updated = true
    }
    if (rateLimit.used !== undefined && Number.isFinite(rateLimit.used)) {
      this.state.used = rateLimit.used
      updated = true
    }
    if (
      rateLimit.remaining !== undefined &&
      Number.isFinite(rateLimit.remaining)
    ) {
      this.state.remaining = rateLimit.remaining
      updated = true
    }

    if (updated) {
      this.state.lastUpdated = Date.now()
    }
  }

  /**
   * Update rate limit state from Discogs response headers.
   *
   * Discogs provides these headers in every response:
   * - X-Discogs-Ratelimit: Total allowed (60 for authenticated, 25 for unauthenticated)
   * - X-Discogs-Ratelimit-Used: How many requests have been made in current window
   * - X-Discogs-Ratelimit-Remaining: How many requests are left in current window
   */
  updateFromHeaders(headers: Record<string, string>): void {
    const limit = headers['x-discogs-ratelimit']
    const used = headers['x-discogs-ratelimit-used']
    const remaining = headers['x-discogs-ratelimit-remaining']

    let updated = false

    if (limit) {
      const parsedLimit = Number.parseInt(limit, 10)
      if (Number.isFinite(parsedLimit)) {
        this.state.limit = parsedLimit
        updated = true
      }
    }

    if (used) {
      const parsedUsed = Number.parseInt(used, 10)
      if (Number.isFinite(parsedUsed)) {
        this.state.used = parsedUsed
        updated = true
      }
    }

    if (remaining) {
      const parsedRemaining = Number.parseInt(remaining, 10)
      if (Number.isFinite(parsedRemaining)) {
        this.state.remaining = parsedRemaining
        updated = true
      }
    }

    if (updated) {
      this.state.lastUpdated = Date.now()
    }
  }

  /**
   * Check if we should throttle requests.
   *
   * Throttles when:
   * - Remaining requests < BUFFER threshold
   *
   * Does NOT throttle when:
   * - 60+ seconds have passed since last request (window reset)
   */
  shouldThrottle(): boolean {
    // Reset if window has passed (Discogs resets after 60s of no requests)
    if (this.resetWindowIfExpired()) {
      return false
    }

    return this.state.remaining - this.inFlight < RATE_LIMIT.BUFFER
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
   * Wait if rate limited, ensuring only one wait at a time.
   *
   * Called by the API client before each request.
   * If approaching rate limit, waits until window resets.
   * Multiple concurrent calls share the same wait promise.
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
   * Track in-flight requests to prevent burst overruns.
   */
  startRequest(): void {
    this.inFlight += 1
  }

  finishRequest(): void {
    this.inFlight = Math.max(0, this.inFlight - 1)
  }

  /**
   * Get current rate limit state (for debugging/display)
   */
  getState(): Readonly<RateLimitState> {
    return { ...this.state }
  }
}

export const rateLimiter = new RateLimiter()
