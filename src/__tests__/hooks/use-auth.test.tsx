import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, vi } from 'vitest'

import { useAuth } from '@/hooks/use-auth'
import { setOAuthTokens, setSessionActive, getOAuthTokens } from '@/lib/storage'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'

import { mockOAuthTokens } from '../mocks/handlers'

import type { ReactNode } from 'react'

/**
 * Creates a mock auth wrapper for testing useAuth hook behavior.
 * Uses a mock AuthContext instead of the real AuthProvider to avoid tRPC dependencies.
 */
function createMockAuthWrapper(overrides: Partial<AuthContextValue> = {}) {
  const defaultValue: AuthContextValue = {
    isAuthenticated: false,
    isLoading: false,
    username: null,
    userId: null,
    avatarUrl: null,
    oauthTokens: null,
    validateOAuthTokens: async () => {},
    signOut: () => {},
    disconnect: () => {},
    ...overrides
  }

  return function MockAuthWrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider value={defaultValue}>
        {children}
      </AuthContext.Provider>
    )
  }
}

describe('useAuth - with mocked context', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('returns unauthenticated state when context is not authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createMockAuthWrapper({ isAuthenticated: false })
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
  })

  it('returns authenticated state when context is authenticated', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createMockAuthWrapper({
        isAuthenticated: true,
        username: 'testuser',
        userId: 123,
        oauthTokens: mockOAuthTokens
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('testuser')
    expect(result.current.userId).toBe(123)
    expect(result.current.oauthTokens).toEqual(mockOAuthTokens)
  })

  it('exposes signOut function', () => {
    const signOut = vi.fn()
    const { result } = renderHook(() => useAuth(), {
      wrapper: createMockAuthWrapper({
        isAuthenticated: true,
        signOut
      })
    })

    act(() => {
      result.current.signOut()
    })

    expect(signOut).toHaveBeenCalled()
  })

  it('exposes disconnect function', () => {
    const disconnect = vi.fn()
    const { result } = renderHook(() => useAuth(), {
      wrapper: createMockAuthWrapper({
        isAuthenticated: true,
        disconnect
      })
    })

    act(() => {
      result.current.disconnect()
    })

    expect(disconnect).toHaveBeenCalled()
  })

  it('throws when used outside of AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })
})

describe('OAuth token storage behavior', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('stores OAuth tokens correctly', () => {
    setOAuthTokens(mockOAuthTokens)
    expect(getOAuthTokens()).toEqual(mockOAuthTokens)
  })

  it('preserves tokens when session becomes inactive', () => {
    setOAuthTokens(mockOAuthTokens)
    setSessionActive(true)

    // Simulate sign out (session inactive but tokens preserved)
    setSessionActive(false)

    // Tokens should still be there
    expect(getOAuthTokens()).toEqual(mockOAuthTokens)
  })
})
