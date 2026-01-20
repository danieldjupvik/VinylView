import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from '../../src/server/trpc/index.js'

export const config = {
  runtime: 'edge'
}

/**
 * Vercel Edge Function handler for tRPC requests.
 * All tRPC procedures are handled through this single endpoint.
 */
export default async function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext: () => ({})
  })
}
