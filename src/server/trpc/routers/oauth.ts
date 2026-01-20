import { DiscogsOAuth } from '@lionralfs/discogs-client'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { publicProcedure, router } from '../init.js'

declare const process: {
  env: {
    VITE_DISCOGS_CONSUMER_KEY?: string
    DISCOGS_CONSUMER_SECRET?: string
  }
}

const CONSUMER_KEY = process.env.VITE_DISCOGS_CONSUMER_KEY
const CONSUMER_SECRET = process.env.DISCOGS_CONSUMER_SECRET

function getDiscogsOAuth() {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Missing Discogs OAuth credentials'
    })
  }

  return new DiscogsOAuth(CONSUMER_KEY, CONSUMER_SECRET)
}

/**
 * OAuth router for Discogs OAuth 1.0a token exchange.
 * These procedures handle the server-side OAuth flow that requires
 * the Consumer Secret (which must never be exposed to the client).
 */
export const oauthRouter = router({
  /**
   * Step 1: Get a request token and authorization URL.
   * Client stores the request token secret in sessionStorage,
   * then redirects user to the authorization URL.
   */
  getRequestToken: publicProcedure
    .input(
      z.object({
        callbackUrl: z.string().url()
      })
    )
    .mutation(async ({ input }) => {
      const oauth = getDiscogsOAuth()

      try {
        const response = await oauth.getRequestToken(input.callbackUrl)

        if (!response.token || !response.tokenSecret) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to obtain request token from Discogs'
          })
        }

        return {
          requestToken: response.token,
          requestTokenSecret: response.tokenSecret,
          authorizeUrl: response.authorizeUrl
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get request token'
        })
      }
    }),

  /**
   * Step 2: Exchange request token + verifier for access token.
   * Called after user authorizes on Discogs and is redirected back.
   */
  getAccessToken: publicProcedure
    .input(
      z.object({
        requestToken: z.string(),
        requestTokenSecret: z.string(),
        verifier: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const oauth = getDiscogsOAuth()

      try {
        const response = await oauth.getAccessToken(
          input.requestToken,
          input.requestTokenSecret,
          input.verifier
        )

        if (!response.accessToken || !response.accessTokenSecret) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Failed to obtain access token from Discogs'
          })
        }

        return {
          accessToken: response.accessToken,
          accessTokenSecret: response.accessTokenSecret
        }
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to get access token'
        })
      }
    })
})
