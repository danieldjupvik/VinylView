import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { appRouter } from '../../src/server/trpc/index.js'

import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Vercel Serverless Function handler for tRPC requests.
 * Converts Node.js request to Web Request for the fetch adapter.
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Construct absolute URL from the request
  const protoHeader = req.headers['x-forwarded-proto']
  const protocol = Array.isArray(protoHeader)
    ? protoHeader[0]
    : (protoHeader ?? 'https')

  const hostHeader = req.headers['x-forwarded-host'] ?? req.headers.host
  const host = Array.isArray(hostHeader)
    ? hostHeader[0]
    : (hostHeader ?? 'localhost')

  const url = `${protocol}://${host}${req.url ?? ''}`

  // Build headers object for Web Request
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) {
      headers[key] = Array.isArray(value) ? value.join(', ') : value
    }
  }

  // Get body for POST/PUT/PATCH requests
  // Vercel pre-parses the body into req.body
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const requestBody = hasBody && req.body ? JSON.stringify(req.body) : null

  // Convert VercelRequest to Web Request
  const webRequest = new Request(url, {
    method: req.method ?? 'GET',
    headers,
    ...(requestBody && { body: requestBody })
  })

  const response = await fetchRequestHandler({
    endpoint: '/api/trpc',
    req: webRequest,
    router: appRouter,
    createContext: () => ({}),
    allowMethodOverride: true // Allow POST for queries (secure OAuth tokens)
  })

  // Send the response
  res.status(response.status)
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  const responseBody = await response.text()
  res.send(responseBody)
}
