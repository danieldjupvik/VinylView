import { describe, it, expect, beforeEach } from 'vitest'
import {
  getToken,
  setToken,
  removeToken,
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
  clearAuth
} from '@/lib/storage'
import { STORAGE_KEYS } from '@/lib/constants'
import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'

describe('Storage utilities', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('Token storage', () => {
    it('stores and retrieves token', () => {
      setToken('test-token')
      expect(getToken()).toBe('test-token')
    })

    it('returns null when no token exists', () => {
      expect(getToken()).toBeNull()
    })

    it('removes token', () => {
      setToken('test-token')
      removeToken()
      expect(getToken()).toBeNull()
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

    it('handles corrupted JSON data gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.IDENTITY, '{invalid}')
      expect(getStoredIdentity()).toBeNull()
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

    it('handles corrupted JSON data gracefully', () => {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, '{incomplete')
      expect(getStoredUserProfile()).toBeNull()
    })

    it('handles malformed JSON with extra characters', () => {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, '{"id":123}extra')
      expect(getStoredUserProfile()).toBeNull()
    })
  })

  describe('clearAuth', () => {
    it('clears all auth-related storage', () => {
      const mockIdentity: DiscogsIdentity = {
        id: 123,
        username: 'testuser',
        resource_url: 'https://api.discogs.com/users/testuser',
        consumer_name: 'VinylDeck'
      }

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

      setToken('test-token')
      setUsername('testuser')
      setAvatarSource('gravatar')
      setGravatarEmail('test@example.com')
      setStoredIdentity(mockIdentity)
      setStoredUserProfile(mockProfile)

      clearAuth()

      expect(getToken()).toBeNull()
      expect(getUsername()).toBeNull()
      expect(getAvatarSource()).toBeNull()
      expect(getGravatarEmail()).toBeNull()
      expect(getStoredIdentity()).toBeNull()
      expect(getStoredUserProfile()).toBeNull()
    })

    it('does not throw when clearing already empty storage', () => {
      expect(() => clearAuth()).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('handles empty string as token', () => {
      setToken('')
      expect(getToken()).toBe('')
    })

    it('handles very long token values', () => {
      const longToken = 'a'.repeat(10000)
      setToken(longToken)
      expect(getToken()).toBe(longToken)
    })

    it('handles special characters in username', () => {
      const specialUsername = 'user@#$%^&*()'
      setUsername(specialUsername)
      expect(getUsername()).toBe(specialUsername)
    })

    it('handles identity with missing optional fields', () => {
      const minimalIdentity: DiscogsIdentity = {
        id: 123,
        username: 'testuser',
        resource_url: 'https://api.discogs.com/users/testuser',
        consumer_name: 'VinylDeck'
      }

      setStoredIdentity(minimalIdentity)
      expect(getStoredIdentity()).toEqual(minimalIdentity)
    })
  })
})
