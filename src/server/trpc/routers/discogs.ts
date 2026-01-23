import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import { createDiscogsClient } from '../../discogs-client.js'
import { publicProcedure, router } from '../init.js'

import type {
  DiscogsCollectionRelease,
  DiscogsPagination
} from '../../../types/discogs.js'

/**
 * Type guard for errors from @lionralfs/discogs-client.
 * DiscogsError is not exported from the package, so we check for the statusCode property.
 */
function isDiscogsError(
  error: unknown
): error is Error & { statusCode: number } {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    typeof (error as Error & { statusCode: unknown }).statusCode === 'number'
  )
}

/**
 * Handles Discogs API errors and converts them to tRPC errors.
 * Checks for 401 errors (invalid/expired tokens) and returns appropriate error codes.
 */
function handleDiscogsError(error: unknown, fallbackMessage: string): never {
  if (isDiscogsError(error) && error.statusCode === 401) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Invalid or expired OAuth tokens'
    })
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: error instanceof Error ? error.message : fallbackMessage
  })
}

/**
 * Discogs API router for proxying authenticated requests.
 * All Discogs API calls must go through the server because OAuth 1.0a
 * requires the Consumer Secret to sign every request.
 */
export const discogsRouter = router({
  /**
   * Get the identity of the authenticated user.
   * Used to validate OAuth tokens and get the username.
   * Uses query (not mutation) but sent as POST via methodOverride for security.
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
          },
          rateLimit
        }
      } catch (error) {
        handleDiscogsError(error, 'Failed to get identity')
      }
    }),

  /**
   * Get a user's collection releases.
   * Supports pagination and sorting.
   * Uses query (not mutation) but sent as POST via methodOverride for security.
   */
  getCollection: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string(),
        username: z.string(),
        folderId: z.number().optional().default(0),
        page: z.number().optional().default(1),
        perPage: z.number().max(100).optional().default(50), // Discogs API max
        sort: z
          .enum([
            'label',
            'artist',
            'title',
            'catno',
            'format',
            'rating',
            'added',
            'year'
          ])
          .optional(),
        sortOrder: z.enum(['asc', 'desc']).optional()
      })
    )
    .query(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )

      try {
        const { data, rateLimit } = await client
          .user()
          .collection()
          .getReleases(input.username, input.folderId, {
            page: input.page,
            per_page: input.perPage,
            ...(input.sort && { sort: input.sort }),
            ...(input.sortOrder && { sort_order: input.sortOrder })
          })

        // Type cast required: @lionralfs/discogs-client types are incomplete.
        // The Discogs API returns additional fields (basic_information, formats, etc.)
        // that our DiscogsCollectionRelease type captures but the library omits.
        return {
          releases: data.releases as unknown as DiscogsCollectionRelease[],
          pagination: data.pagination as unknown as DiscogsPagination,
          rateLimit
        }
      } catch (error) {
        handleDiscogsError(error, 'Failed to get collection')
      }
    }),

  /**
   * Get a user's profile including avatar_url and email.
   * Email is only visible when authenticated as the requested user.
   * Uses query (not mutation) but sent as POST via methodOverride for security.
   */
  getUserProfile: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string(),
        username: z.string()
      })
    )
    .query(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )

      try {
        const { data, rateLimit } = await client
          .user()
          .getProfile(input.username)

        return {
          profile: {
            id: data.id,
            username: data.username,
            avatar_url: data.avatar_url,
            email: data.email,
            num_collection: data.num_collection,
            num_wantlist: data.num_wantlist
          },
          rateLimit
        }
      } catch (error) {
        handleDiscogsError(error, 'Failed to get user profile')
      }
    }),

  /**
   * Get collection metadata for change detection.
   * Returns only the total count without fetching full collection data.
   * Fast endpoint (1 API call) for detecting new/deleted items.
   */
  getCollectionMetadata: publicProcedure
    .input(
      z.object({
        accessToken: z.string(),
        accessTokenSecret: z.string(),
        username: z.string()
      })
    )
    .query(async ({ input }) => {
      const client = createDiscogsClient(
        input.accessToken,
        input.accessTokenSecret
      )

      try {
        // Fetch only first page with per_page=1 (minimal data transfer)
        const { data, rateLimit } = await client
          .user()
          .collection()
          .getReleases(input.username, 0, {
            page: 1,
            per_page: 1
          })

        return {
          totalCount: data.pagination.items,
          rateLimit
        }
      } catch (error) {
        handleDiscogsError(error, 'Failed to get collection metadata')
      }
    })
})
