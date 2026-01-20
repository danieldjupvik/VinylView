import { createTRPCReact, httpBatchLink } from '@trpc/react-query'

import type { AppRouter } from '@/server/trpc/index.ts'

/**
 * tRPC React client instance.
 * Use this to call tRPC procedures from React components.
 *
 * @example
 * ```tsx
 * const getRequestToken = trpc.oauth.getRequestToken.useMutation()
 * await getRequestToken.mutateAsync({ callbackUrl: '...' })
 * ```
 */
export const trpc = createTRPCReact<AppRouter>()

/**
 * Determine the base URL for API requests depending on the runtime environment.
 *
 * @returns `''` when running in a browser (use relative URLs); otherwise `'http://localhost:3000'` for server-side usage.
 */
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return ''
  }
  return 'http://localhost:3000'
}

/**
 * Create a tRPC client for use outside of React components.
 *
 * @returns A tRPC client instance configured to call the application's tRPC HTTP API.
 * @example
 * const client = createTRPCClient();
 * // use client to call procedures, e.g. client.query('someRouter.someProcedure', { ... })
 */
export function createTRPCClient(): ReturnType<typeof trpc.createClient> {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`
      })
    ]
  })
}