import { DiscogsClient } from '@lionralfs/discogs-client'
import { TRPCError } from '@trpc/server'

declare const process: {
  env: {
    VITE_DISCOGS_CONSUMER_KEY?: string
    DISCOGS_CONSUMER_SECRET?: string
    npm_package_version?: string
  }
}

// Use package version from env (available in Node.js) or fallback
const APP_VERSION = process.env.npm_package_version ?? '1.0.0'

const CONSUMER_KEY = process.env.VITE_DISCOGS_CONSUMER_KEY
const CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET

/**
 * Creates an authenticated DiscogsClient instance for making API calls.
 * The client is configured with OAuth 1.0a credentials and handles
 * request signing automatically.
 *
 * @param accessToken - The user's OAuth access token
 * @param accessTokenSecret - The user's OAuth access token secret
 * @returns An authenticated DiscogsClient instance
 * @throws TRPCError if consumer credentials are missing
 */
export function createDiscogsClient(
  accessToken: string,
  accessTokenSecret: string
): DiscogsClient {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing Discogs OAuth credentials'
    })
  }

  return new DiscogsClient({
    auth: {
      method: 'oauth',
      consumerKey: CONSUMER_KEY,
      consumerSecret: CONSUMER_SECRET,
      accessToken,
      accessTokenSecret
    },
    userAgent: `VinylDeck/${APP_VERSION}`
  })
}
