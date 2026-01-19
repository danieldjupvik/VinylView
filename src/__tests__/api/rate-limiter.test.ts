import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'

import { rateLimiter } from '@/api/rate-limiter'
import { RATE_LIMIT } from '@/lib/constants'

describe('rateLimiter', () => {
  beforeEach(() => {
    rateLimiter.updateFromHeaders({
      'x-discogs-ratelimit': String(RATE_LIMIT.MAX_REQUESTS),
      'x-discogs-ratelimit-used': '0',
      'x-discogs-ratelimit-remaining': String(RATE_LIMIT.MAX_REQUESTS)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks rate limit state from headers', () => {
    rateLimiter.updateFromHeaders({
      'x-discogs-ratelimit': '60',
      'x-discogs-ratelimit-used': '12',
      'x-discogs-ratelimit-remaining': '48'
    })

    const state = rateLimiter.getState()
    expect(state.limit).toBe(60)
    expect(state.used).toBe(12)
    expect(state.remaining).toBe(48)
  })

  it('throttles when remaining requests drop below the buffer', () => {
    rateLimiter.updateFromHeaders({
      'x-discogs-ratelimit-remaining': String(RATE_LIMIT.BUFFER - 1)
    })

    expect(rateLimiter.shouldThrottle()).toBe(true)
  })

  it('waits until the window resets when rate limited', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(0))

    rateLimiter.updateFromHeaders({
      'x-discogs-ratelimit-remaining': '0'
    })

    const waitPromise = rateLimiter.waitIfNeeded()
    vi.advanceTimersByTime(RATE_LIMIT.WINDOW_MS)
    await waitPromise

    expect(rateLimiter.getWaitTime()).toBe(0)
  })
})
