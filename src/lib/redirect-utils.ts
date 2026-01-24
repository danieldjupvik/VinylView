import { SESSION_KEYS } from '@/lib/storage-keys'

/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows internal paths starting with "/". Decodes URL-encoded
 * characters before validation to prevent bypass attacks.
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe for internal redirect
 */
export function isValidRedirectUrl(url: string): boolean {
  // Decode URL to catch encoded bypass attempts (e.g., /%2f%2fevil.com -> //evil.com)
  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(url)
  } catch {
    // Invalid URL encoding
    return false
  }

  // Must start with "/" for internal paths
  if (!url.startsWith('/')) {
    return false
  }

  // Block protocol-relative URLs (//evil.com) - check both encoded and decoded
  if (url.startsWith('//') || decodedUrl.startsWith('//')) {
    return false
  }

  // Block backslashes (browser confusion attacks like /\evil.com)
  if (url.includes('\\') || decodedUrl.includes('\\')) {
    return false
  }

  // Block redirect to login (prevent redirect loops) - exact match or with query/hash
  if (/^\/login(?:[?#]|$)/.test(url) || /^\/login(?:[?#]|$)/.test(decodedUrl)) {
    return false
  }

  return true
}

/**
 * Stores the current URL (path + query params + hash) for post-login redirect.
 * Hash fragments are preserved if provided.
 *
 * @param url - The URL to store (e.g., "/collection?style=Rock" or "/settings#appearance")
 */
export function storeRedirectUrl(url: string): void {
  if (isValidRedirectUrl(url)) {
    sessionStorage.setItem(SESSION_KEYS.REDIRECT_URL, url)
  }
}

/**
 * Retrieves and clears the stored redirect URL.
 * Returns null if no URL is stored or if validation fails.
 *
 * @returns The stored redirect URL if valid, or null
 */
export function getAndClearRedirectUrl(): string | null {
  const url = sessionStorage.getItem(SESSION_KEYS.REDIRECT_URL)
  sessionStorage.removeItem(SESSION_KEYS.REDIRECT_URL)

  if (url && isValidRedirectUrl(url)) {
    return url
  }

  return null
}
