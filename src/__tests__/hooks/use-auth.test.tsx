import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, expect, it, beforeEach } from 'vitest'

import { useAuth } from '@/hooks/use-auth'
import { setOAuthTokens } from '@/lib/storage'

// TODO: These tests need to be rewritten for OAuth flow
// The old PAT-based login tests are no longer applicable.
// New tests should:
// 1. Create a TRPCTestProvider that mocks tRPC calls
// 2. Mock discogs.getIdentity responses
// 3. Test OAuth token validation flow
// 4. Test validateOAuthTokens() function

// Placeholder wrapper - tests are skipped until properly implemented
const wrapper = ({ children }: { children: React.ReactNode }) => children

describe.skip('useAuth - OAuth flow', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('starts unauthenticated when no OAuth tokens are stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(result.current.oauthTokens).toBeNull()
  })

  it('validates OAuth tokens and updates auth state', async () => {
    // Store OAuth tokens before rendering
    setOAuthTokens({
      accessToken: 'valid-access-token',
      accessTokenSecret: 'valid-secret'
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // With valid tokens and mocked tRPC, should be authenticated
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.oauthTokens).not.toBeNull()
  })

  it('logs out and clears auth state', async () => {
    setOAuthTokens({
      accessToken: 'valid-access-token',
      accessTokenSecret: 'valid-secret'
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(result.current.oauthTokens).toBeNull()
    expect(localStorage.getItem('vinyldeck_oauth_token')).toBeNull()
  })

  it('clears auth when OAuth tokens are invalid', async () => {
    setOAuthTokens({
      accessToken: 'invalid-token',
      accessTokenSecret: 'invalid-secret'
    })

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // With invalid tokens, should clear auth
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.oauthTokens).toBeNull()
  })
})
