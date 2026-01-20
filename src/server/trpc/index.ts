import { router } from './init.js'
import { discogsRouter } from './routers/discogs.js'
import { oauthRouter } from './routers/oauth.js'

/**
 * Root tRPC router combining all sub-routers.
 */
export const appRouter = router({
  oauth: oauthRouter,
  discogs: discogsRouter
})

export type AppRouter = typeof appRouter

// Re-export for convenience
export { publicProcedure, router } from './init.js'
