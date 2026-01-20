import { initTRPC } from '@trpc/server'

/**
 * tRPC initialization for the server.
 * This file contains only the tRPC instance setup to avoid circular dependencies.
 */
const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure
