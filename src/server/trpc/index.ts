import { router } from './init.ts'
import { discogsRouter } from './routers/discogs.ts'
import { oauthRouter } from './routers/oauth.ts'

/**
 * Root tRPC router combining all sub-routers.
 */
export const appRouter = router({
  oauth: oauthRouter,
  discogs: discogsRouter
})

export type AppRouter = typeof appRouter

// Re-export for convenience
export { publicProcedure, router } from './init.ts'
