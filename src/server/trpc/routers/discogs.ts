import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createDiscogsClient } from '../../discogs-client.ts'
import { publicProcedure, router } from '../init.ts'

/**
 * Discogs API router for proxying authenticated requests.
 * All Discogs API calls must go through the server because OAuth 1.0a
 * requires the Consumer Secret to sign every request.
 */
export const discogsRouter = router({
  /**
   * Get the identity of the authenticated user.
   * Used to validate OAuth tokens and get the username.
   */
  getIdentity: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string()
      })
    )
    .query(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )

      try {
        const { data, rateLimit } = await client.getIdentity()

        return {
          identity: {
            id: data.id,
            username: data.username,
            resource_url: data.resource_url,
            consumer_name: data.consumer_name
            // Note: avatar_url is not returned by /oauth/identity endpoint
            // Use getUserProfile to get avatar
          },
          rateLimit
        }
      } catch (error) {
        // Handle Discogs API errors
        if (error instanceof Error && error.message.includes('401')) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired OAuth tokens'
          })
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to get identity'
        })
      }
    })
})
