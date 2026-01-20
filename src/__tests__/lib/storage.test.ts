import { describe, it, expect, beforeEach } from 'vitest'

import { STORAGE_KEYS } from '@/lib/constants'
import {
  getOAuthTokens,
  setOAuthTokens,
  removeOAuthTokens,
  getUsername,
  setUsername,
  removeUsername,
  getAvatarSource,
  setAvatarSource,
  removeAvatarSource,
  getGravatarEmail,
  setGravatarEmail,
  removeGravatarEmail,
  getStoredIdentity,
  setStoredIdentity,
  removeStoredIdentity,
  getStoredUserProfile,
  setStoredUserProfile,
  removeStoredUserProfile,
  getViewMode,
  setViewMode,
  isSessionActive,
  setSessionActive,
  signOut,
  disconnectDiscogs
} from '@/lib/storage'
import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'

describe('Storage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('OAuth token storage', () => {
    const mockTokens = {
      accessToken: 'test-access-token',
      accessTokenSecret: 'test-access-secret'
    }

    it('stores and retrieves OAuth tokens', () => {
      setOAuthTokens(mockTokens)
      expect(getOAuthTokens()).toEqual(mockTokens)
    })

    it('returns null when no OAuth tokens exist', () => {
      expect(getOAuthTokens()).toBeNull()
    })

    it('returns null when only access token exists', () => {
      localStorage.setItem(STORAGE_KEYS.OAUTH_ACCESS_TOKEN, 'only-token')
      expect(getOAuthTokens()).toBeNull()
    })

    it('returns null when only access token secret exists', () => {
      localStorage.setItem(
        STORAGE_KEYS.OAUTH_ACCESS_TOKEN_SECRET,
        'only-secret'
      )
      expect(getOAuthTokens()).toBeNull()
    })

    it('removes OAuth tokens', () => {
      setOAuthTokens(mockTokens)
      removeOAuthTokens()
      expect(getOAuthTokens()).toBeNull()
    })
  })

  describe('Session management', () => {
    it('session is inactive by default', () => {
      expect(isSessionActive()).toBe(false)
    })

    it('sets session active', () => {
      setSessionActive(true)
      expect(isSessionActive()).toBe(true)
    })

    it('sets session inactive', () => {
      setSessionActive(true)
      setSessionActive(false)
      expect(isSessionActive()).toBe(false)
    })
  })

  describe('signOut', () => {
    it('ends session but preserves OAuth tokens', () => {
      const mockTokens = {
        accessToken: 'test-access-token',
        accessTokenSecret: 'test-access-secret'
      }

      setOAuthTokens(mockTokens)
      setSessionActive(true)
      setUsername('testuser')

      signOut()

      expect(isSessionActive()).toBe(false)
      // Tokens should still exist for "Welcome back" flow
      expect(getOAuthTokens()).toEqual(mockTokens)
      // Username preserved for "Welcome back" display
      expect(getUsername()).toBe('testuser')
    })
  })

  describe('disconnectDiscogs', () => {
    it('fully removes all auth data', () => {
      const mockIdentity: DiscogsIdentity = {
        id: 123,
        username: 'testuser',
        resource_url: 'https://api.discogs.com/users/testuser',
        consumer_name: 'VinylDeck'
      }

      const mockTokens = {
        accessToken: 'test-access-token',
        accessTokenSecret: 'test-access-secret'
      }

      setOAuthTokens(mockTokens)
      setSessionActive(true)
      setUsername('testuser')
      setStoredIdentity(mockIdentity)

      disconnectDiscogs()

      expect(isSessionActive()).toBe(false)
      expect(getOAuthTokens()).toBeNull()
      expect(getUsername()).toBeNull()
      expect(getStoredIdentity()).toBeNull()
    })
  })

  describe('Username storage', () => {
    it('stores and retrieves username', () => {
      setUsername('testuser')
      expect(getUsername()).toBe('testuser')
    })

    it('returns null when no username exists', () => {
      expect(getUsername()).toBeNull()
    })

    it('removes username', () => {
      setUsername('testuser')
      removeUsername()
      expect(getUsername()).toBeNull()
    })
  })

  describe('Avatar source storage', () => {
    it('stores and retrieves avatar source', () => {
      setAvatarSource('gravatar')
      expect(getAvatarSource()).toBe('gravatar')
    })

    it('returns null when no avatar source exists', () => {
      expect(getAvatarSource()).toBeNull()
    })

    it('removes avatar source', () => {
      setAvatarSource('gravatar')
      removeAvatarSource()
      expect(getAvatarSource()).toBeNull()
    })
  })

  describe('Gravatar email storage', () => {
    it('stores and retrieves gravatar email', () => {
      setGravatarEmail('test@example.com')
      expect(getGravatarEmail()).toBe('test@example.com')
    })

    it('returns null when no gravatar email exists', () => {
      expect(getGravatarEmail()).toBeNull()
    })

    it('removes gravatar email', () => {
      setGravatarEmail('test@example.com')
      removeGravatarEmail()
      expect(getGravatarEmail()).toBeNull()
    })
  })

  describe('Identity storage', () => {
    const mockIdentity: DiscogsIdentity = {
      id: 123,
      username: 'testuser',
      resource_url: 'https://api.discogs.com/users/testuser',
      consumer_name: 'VinylDeck'
    }

    it('stores and retrieves identity', () => {
      setStoredIdentity(mockIdentity)
      expect(getStoredIdentity()).toEqual(mockIdentity)
    })

    it('returns null when no identity exists', () => {
      expect(getStoredIdentity()).toBeNull()
    })

    it('removes identity', () => {
      setStoredIdentity(mockIdentity)
      removeStoredIdentity()
      expect(getStoredIdentity()).toBeNull()
    })

    it('returns null and clears storage when JSON parsing fails', () => {
      localStorage.setItem(STORAGE_KEYS.IDENTITY, 'invalid-json')
      expect(getStoredIdentity()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.IDENTITY)).toBeNull()
    })
  })

  describe('User profile storage', () => {
    const mockProfile: DiscogsUserProfile = {
      id: 123,
      username: 'testuser',
      resource_url: 'https://api.discogs.com/users/testuser',
      uri: 'https://www.discogs.com/user/testuser',
      name: 'Test User',
      email: 'test@example.com',
      avatar_url: 'https://example.com/avatar.jpg',
      num_collection: 100,
      num_wantlist: 50
    }

    it('stores and retrieves user profile', () => {
      setStoredUserProfile(mockProfile)
      expect(getStoredUserProfile()).toEqual(mockProfile)
    })

    it('returns null when no user profile exists', () => {
      expect(getStoredUserProfile()).toBeNull()
    })

    it('removes user profile', () => {
      setStoredUserProfile(mockProfile)
      removeStoredUserProfile()
      expect(getStoredUserProfile()).toBeNull()
    })

    it('returns null and clears storage when JSON parsing fails', () => {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, 'invalid-json')
      expect(getStoredUserProfile()).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.USER_PROFILE)).toBeNull()
    })
  })

  describe('View mode storage', () => {
    it('stores and retrieves view mode', () => {
      setViewMode('table')
      expect(getViewMode()).toBe('table')
    })

    it('defaults to grid when no view mode exists', () => {
      expect(getViewMode()).toBe('grid')
    })

    it('falls back to grid for unknown values', () => {
      localStorage.setItem(STORAGE_KEYS.VIEW_MODE, 'list')
      expect(getViewMode()).toBe('grid')
    })
  })
})
