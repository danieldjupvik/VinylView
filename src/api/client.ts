import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

import { DISCOGS_API_URL } from '@/lib/constants'
import { getToken } from '@/lib/storage'

import { rateLimiter } from './rate-limiter'

export const apiClient = axios.create({
  baseURL: DISCOGS_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error))

/**
 * Request interceptor: Add auth header and handle rate limiting
 *
 * Discogs API Requirements:
 * - Authentication: Must include "Discogs token={token}" in Authorization header
 * - Rate Limiting: Respect 60 req/min for authenticated, 25 req/min for unauthenticated
 * - User Agent: Should identify application (handled by axios defaults)
 *
 * This interceptor:
 * 1. Waits if approaching rate limit (via rateLimiter.waitIfNeeded())
 * 2. Adds Authorization header with token from localStorage
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    rateLimiter.startRequest()

    // Wait if we're being rate limited
    await rateLimiter.waitIfNeeded()

    // Add auth header if token exists and header not already set
    const token = getToken()
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Discogs token=${token}`
    }

    return config
  },
  (error) => {
    rateLimiter.finishRequest()
    return Promise.reject(toError(error))
  }
)

/**
 * Helper to extract Discogs rate limit headers from Axios response.
 *
 * Discogs provides these headers in every response:
 * - X-Discogs-Ratelimit: Total requests allowed per minute
 * - X-Discogs-Ratelimit-Used: Requests made in current window
 * - X-Discogs-Ratelimit-Remaining: Remaining requests in window
 */
function extractRateLimitHeaders(
  axiosHeaders: Record<string, unknown>
): Record<string, string> {
  const headers: Record<string, string> = {}
  const rateLimitKeys = [
    'x-discogs-ratelimit',
    'x-discogs-ratelimit-used',
    'x-discogs-ratelimit-remaining'
  ]

  for (const key of rateLimitKeys) {
    const headerAccessor = axiosHeaders as { get?: (name: string) => unknown }
    const fromAccessor =
      typeof headerAccessor.get === 'function' ? headerAccessor.get(key) : null
    const value =
      typeof fromAccessor === 'string' ? fromAccessor : axiosHeaders[key]
    if (typeof value === 'string') {
      headers[key] = value
    }
  }

  return headers
}

/**
 * Response interceptor: Update rate limit state from headers
 *
 * Extracts rate limit info from every Discogs API response
 * and updates the rate limiter state. This allows the rate
 * limiter to accurately track remaining requests and throttle
 * when necessary.
 *
 * Updates are performed on both successful and error responses.
 */
apiClient.interceptors.response.use(
  (response) => {
    rateLimiter.finishRequest()

    // Update rate limiter from response headers
    const headers = extractRateLimitHeaders(response.headers)
    rateLimiter.updateFromHeaders(headers)

    return response
  },
  (error: AxiosError) => {
    rateLimiter.finishRequest()

    // Update rate limiter even on error responses
    if (error.response?.headers) {
      const headers = extractRateLimitHeaders(
        error.response.headers as Record<string, unknown>
      )
      rateLimiter.updateFromHeaders(headers)
    }

    return Promise.reject(toError(error))
  }
)

export interface ApiError {
  status: number
  message: string
}

export function isAxiosError(error: unknown): error is AxiosError {
  return axios.isAxiosError(error)
}

export function getApiError(error: unknown): ApiError {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status ?? 0,
      message: error.message
    }
  }
  return {
    status: 0,
    message: 'Unknown error'
  }
}
