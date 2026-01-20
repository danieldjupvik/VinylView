import { http, HttpResponse } from 'msw'

/**
 * Mock user data for tests.
 */
export const mockUser = {
  id: 123,
  username: 'testuser',
  resource_url: 'https://api.discogs.com/users/testuser',
  consumer_name: 'VinylDeck Test'
}

export const mockUserProfile = {
  id: 123,
  username: 'testuser',
  avatar_url:
    'https://www.gravatar.com/avatar/55502f40dc8b7c769880b10874abc9d0?s=52&r=pg&d=mm',
  email: 'testuser@example.com',
  num_collection: 150,
  num_wantlist: 25
}

/**
 * Mock OAuth tokens used in tests.
 */
export const mockOAuthTokens = {
  accessToken: 'valid-access-token',
  accessTokenSecret: 'valid-access-secret'
}

/**
 * Mock rate limit response data.
 */
export const mockRateLimit = {
  limit: 60,
  used: 5,
  remaining: 55
}

/**
 * Build a mock release for testing.
 */
export function buildMockRelease({
  id,
  instanceId,
  title,
  artist,
  genres = ['Rock'],
  styles = [],
  formats = [{ name: 'Vinyl', qty: '1' }],
  year = 2020,
  country = 'US'
}: {
  id: number
  instanceId: number
  title: string
  artist: string
  genres?: string[]
  styles?: string[]
  formats?: { name: string; qty: string; descriptions?: string[] }[]
  year?: number
  country?: string
}) {
  return {
    id,
    instance_id: instanceId,
    date_added: '2024-01-10T14:20:00-08:00',
    basic_information: {
      id,
      title,
      year,
      country,
      resource_url: `https://api.discogs.com/releases/${id}`,
      thumb: `https://i.discogs.com/thumb${id}.jpg`,
      cover_image: `https://i.discogs.com/cover${id}.jpg`,
      formats,
      labels: [{ name: 'Test Label', catno: 'TL001' }],
      artists: [{ name: artist, id }],
      genres,
      styles
    }
  }
}

/**
 * Default mock releases for collection tests.
 */
export const mockReleases = [
  buildMockRelease({
    id: 1,
    instanceId: 101,
    title: 'Test Album',
    artist: 'Test Artist',
    genres: ['Rock'],
    styles: ['Indie Rock']
  }),
  buildMockRelease({
    id: 2,
    instanceId: 102,
    title: 'Another Album',
    artist: 'Another Artist',
    genres: ['Electronic'],
    styles: ['Ambient']
  })
]

/**
 * Parse tRPC mutation input from request body.
 * All discogs endpoints use mutations (POST) for security - tokens in body, not URL.
 */
async function parseTRPCMutationInput(
  request: Request
): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as Record<string, unknown>
    // For batch requests, input is { "0": { json: { ...data } } }
    const firstInput = body['0']
    if (typeof firstInput === 'object' && firstInput !== null) {
      const maybeJson = firstInput as { json?: unknown }
      if (maybeJson.json && typeof maybeJson.json === 'object') {
        return maybeJson.json as Record<string, unknown>
      }
      return firstInput as Record<string, unknown>
    }
    return body
  } catch {
    return {}
  }
}

/**
 * Create a tRPC success response.
 */
function trpcSuccess(data: unknown) {
  return HttpResponse.json([{ result: { data } }])
}

/**
 * Create a tRPC error response.
 */
function trpcError(code: string, message: string) {
  return HttpResponse.json([
    {
      error: {
        message,
        code: -32600,
        data: {
          code,
          httpStatus: code === 'UNAUTHORIZED' ? 401 : 500
        }
      }
    }
  ])
}

/**
 * Validate OAuth tokens from tRPC input.
 */
function validateTokens(input: Record<string, unknown>): boolean {
  return (
    input['accessToken'] === mockOAuthTokens.accessToken &&
    input['accessTokenSecret'] === mockOAuthTokens.accessTokenSecret
  )
}

/**
 * MSW handlers for tRPC endpoints.
 * These mock the server-side tRPC procedures.
 */
export const handlers = [
  // tRPC: discogs.getIdentity (mutation - POST for security)
  http.post(
    'http://localhost:3000/api/trpc/discogs.getIdentity',
    async ({ request }) => {
      const input = await parseTRPCMutationInput(request)

      if (!validateTokens(input)) {
        return trpcError('UNAUTHORIZED', 'Invalid or expired OAuth tokens')
      }

      return trpcSuccess({
        identity: mockUser,
        rateLimit: mockRateLimit
      })
    }
  ),

  // tRPC: discogs.getUserProfile (mutation - POST for security)
  http.post(
    'http://localhost:3000/api/trpc/discogs.getUserProfile',
    async ({ request }) => {
      const input = await parseTRPCMutationInput(request)

      if (!validateTokens(input)) {
        return trpcError('UNAUTHORIZED', 'Invalid or expired OAuth tokens')
      }

      return trpcSuccess({
        profile: mockUserProfile,
        rateLimit: mockRateLimit
      })
    }
  ),

  // tRPC: discogs.getCollection (mutation - POST for security)
  http.post(
    'http://localhost:3000/api/trpc/discogs.getCollection',
    async ({ request }) => {
      const input = await parseTRPCMutationInput(request)

      if (!validateTokens(input)) {
        return trpcError('UNAUTHORIZED', 'Invalid or expired OAuth tokens')
      }

      const page = (input['page'] as number) || 1
      const perPage = (input['perPage'] as number) || 50

      return trpcSuccess({
        releases: mockReleases,
        pagination: {
          page,
          pages: 1,
          per_page: perPage,
          items: mockReleases.length,
          urls: {}
        },
        rateLimit: mockRateLimit
      })
    }
  ),

  // tRPC: oauth.getRequestToken (mutation - POST)
  http.post('http://localhost:3000/api/trpc/oauth.getRequestToken', () => {
    return trpcSuccess({
      requestToken: 'mock-request-token',
      requestTokenSecret: 'mock-request-secret',
      authorizeUrl:
        'https://discogs.com/oauth/authorize?oauth_token=mock-request-token'
    })
  }),

  // tRPC: oauth.getAccessToken (mutation - POST)
  http.post('http://localhost:3000/api/trpc/oauth.getAccessToken', () => {
    return trpcSuccess({
      accessToken: mockOAuthTokens.accessToken,
      accessTokenSecret: mockOAuthTokens.accessTokenSecret
    })
  })
]
