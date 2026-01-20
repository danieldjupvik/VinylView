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
 * Create an authenticated DiscogsClient configured for OAuth using application consumer credentials and the provided user access token.
 *
 * @param accessToken - User's OAuth access token.
 * @param accessTokenSecret - User's OAuth access token secret.
 * @returns An authenticated DiscogsClient instance.
 * @throws TRPCError if Discogs consumer key or secret are not configured.
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