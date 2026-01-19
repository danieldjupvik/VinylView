import { SESSION_STORAGE_KEYS } from '@/lib/constants'

/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows internal paths starting with "/".
 *
 * @param url - The URL to validate
 * @returns true if the URL is safe for internal redirect
 */
export function isValidRedirectUrl(url: string): boolean {
  // Must start with "/" for internal paths
  if (!url.startsWith('/')) {
    return false
  }

  // Block protocol-relative URLs (//evil.com)
  if (url.startsWith('//')) {
    return false
  }

  // Block backslashes (browser confusion attacks like /\evil.com)
  if (url.includes('\\')) {
    return false
  }

  // Block redirect to login (prevent redirect loops)
  if (
    url === '/login' ||
    url.startsWith('/login?') ||
    url.startsWith('/login/')
  ) {
    return false
  }

  return true
}

/**
 * Stores the current URL (path + query params) for post-login redirect.
 *
 * @param url - The URL to store (should be path + search, e.g., "/collection?style=Rock")
 */
export function storeRedirectUrl(url: string): void {
  if (isValidRedirectUrl(url)) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT_URL, url)
  }
}

/**
 * Retrieves and clears the stored redirect URL.
 * Returns null if no URL is stored or if validation fails.
 *
 * @returns The stored redirect URL if valid, or null
 */
export function getAndClearRedirectUrl(): string | null {
  const url = sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.REDIRECT_URL)

  if (url && isValidRedirectUrl(url)) {
    return url
  }

  return null
}
