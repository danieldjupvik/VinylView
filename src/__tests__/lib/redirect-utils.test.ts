import { beforeEach, describe, expect, it } from 'vitest'

import { SESSION_STORAGE_KEYS } from '@/lib/constants'
import {
  getAndClearRedirectUrl,
  isValidRedirectUrl,
  storeRedirectUrl
} from '@/lib/redirect-utils'

describe('redirect-utils', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  describe('isValidRedirectUrl', () => {
    it('accepts valid internal paths', () => {
      expect(isValidRedirectUrl('/settings')).toBe(true)
      expect(isValidRedirectUrl('/collection')).toBe(true)
      expect(isValidRedirectUrl('/profile')).toBe(true)
    })

    it('accepts paths with query parameters', () => {
      expect(isValidRedirectUrl('/collection?style=Rock')).toBe(true)
      expect(isValidRedirectUrl('/collection?page=2&sort=asc')).toBe(true)
      expect(isValidRedirectUrl('/settings?tab=preferences')).toBe(true)
    })

    it('accepts paths with hash fragments', () => {
      expect(isValidRedirectUrl('/settings#appearance')).toBe(true)
      expect(isValidRedirectUrl('/collection?style=Rock#top')).toBe(true)
    })

    it('rejects external URLs', () => {
      expect(isValidRedirectUrl('https://evil.com')).toBe(false)
      expect(isValidRedirectUrl('http://evil.com')).toBe(false)
      expect(isValidRedirectUrl('ftp://evil.com')).toBe(false)
    })

    it('rejects protocol-relative URLs', () => {
      expect(isValidRedirectUrl('//evil.com')).toBe(false)
      expect(isValidRedirectUrl('//evil.com/path')).toBe(false)
    })

    it('rejects URL-encoded bypass attempts', () => {
      // /%2f%2f decodes to //
      expect(isValidRedirectUrl('/%2f%2fevil.com')).toBe(false)
      expect(isValidRedirectUrl('/%2F%2Fevil.com')).toBe(false)
      // /%5c decodes to backslash
      expect(isValidRedirectUrl('/%5cevil.com')).toBe(false)
      expect(isValidRedirectUrl('/%5Cevil.com')).toBe(false)
    })

    it('rejects invalid URL encoding', () => {
      expect(isValidRedirectUrl('/%invalid')).toBe(false)
      expect(isValidRedirectUrl('/path%')).toBe(false)
    })

    it('rejects URLs with backslashes', () => {
      expect(isValidRedirectUrl('/\\evil.com')).toBe(false)
      expect(isValidRedirectUrl('\\evil.com')).toBe(false)
      expect(isValidRedirectUrl('/path\\subpath')).toBe(false)
    })

    it('rejects exact login path to prevent redirect loops', () => {
      expect(isValidRedirectUrl('/login')).toBe(false)
      expect(isValidRedirectUrl('/login?foo=bar')).toBe(false)
      expect(isValidRedirectUrl('/login#hash')).toBe(false)
    })

    it('accepts paths that start with /login but are not the exact login route', () => {
      expect(isValidRedirectUrl('/login/')).toBe(true)
      expect(isValidRedirectUrl('/login/callback')).toBe(true)
      expect(isValidRedirectUrl('/user-login-history')).toBe(true)
      expect(isValidRedirectUrl('/settings/login-methods')).toBe(true)
    })

    it('rejects empty strings', () => {
      expect(isValidRedirectUrl('')).toBe(false)
    })

    it('rejects paths not starting with /', () => {
      expect(isValidRedirectUrl('collection')).toBe(false)
      expect(isValidRedirectUrl('settings?foo=bar')).toBe(false)
    })
  })

  describe('storeRedirectUrl', () => {
    it('stores valid URL in sessionStorage', () => {
      storeRedirectUrl('/collection?style=Rock')
      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)).toBe(
        '/collection?style=Rock'
      )
    })

    it('does not store invalid URLs', () => {
      storeRedirectUrl('https://evil.com')
      expect(
        sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
      ).toBeNull()
    })

    it('does not store login paths', () => {
      storeRedirectUrl('/login')
      expect(
        sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
      ).toBeNull()
    })

    it('overwrites previously stored URL', () => {
      storeRedirectUrl('/settings')
      storeRedirectUrl('/collection')
      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)).toBe(
        '/collection'
      )
    })
  })

  describe('getAndClearRedirectUrl', () => {
    it('retrieves and clears stored URL', () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEYS.REDIRECT_URL,
        '/collection?style=Rock'
      )

      const url = getAndClearRedirectUrl()

      expect(url).toBe('/collection?style=Rock')
      expect(
        sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
      ).toBeNull()
    })

    it('returns null when no URL is stored', () => {
      expect(getAndClearRedirectUrl()).toBeNull()
    })

    it('returns null for invalid stored URLs (tampered sessionStorage)', () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEYS.REDIRECT_URL,
        'https://evil.com'
      )

      const url = getAndClearRedirectUrl()

      expect(url).toBeNull()
      expect(
        sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
      ).toBeNull()
    })

    it('returns null for login paths (tampered sessionStorage)', () => {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT_URL, '/login')

      const url = getAndClearRedirectUrl()

      expect(url).toBeNull()
    })

    it('clears storage even when returning null', () => {
      sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT_URL, '//evil.com')

      getAndClearRedirectUrl()

      expect(
        sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)
      ).toBeNull()
    })
  })

  describe('integration: store and retrieve', () => {
    it('stores and retrieves URL correctly', () => {
      storeRedirectUrl('/collection?style=Conscious')

      const url = getAndClearRedirectUrl()

      expect(url).toBe('/collection?style=Conscious')
    })

    it('handles multiple store/retrieve cycles', () => {
      storeRedirectUrl('/settings')
      expect(getAndClearRedirectUrl()).toBe('/settings')

      storeRedirectUrl('/collection')
      expect(getAndClearRedirectUrl()).toBe('/collection')

      expect(getAndClearRedirectUrl()).toBeNull()
    })
  })
})
