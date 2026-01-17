import { describe, expect, it, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { useAuth } from '@/hooks/use-auth'
import { setToken, setUsername } from '@/lib/storage'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

const wrapper = ({ children }: { children: ReactNode }) => (
  <PreferencesProvider>
    <AuthProvider>{children}</AuthProvider>
  </PreferencesProvider>
)

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts unauthenticated when no token is stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
  })

  it('logs in and updates auth state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('testuser', 'valid-token')
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('testuser')
    expect(localStorage.getItem('vinylview_token')).toBe('valid-token')
  })

  it('logs out and clears auth state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('testuser', 'valid-token')
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(localStorage.getItem('vinylview_token')).toBeNull()
  })

  it('throws error when login credentials are invalid', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await expect(
      act(async () => {
        await result.current.login('testuser', 'invalid-token')
      })
    ).rejects.toThrow('Invalid credentials')

    expect(result.current.isAuthenticated).toBe(false)
  })

  it.skip('throws error when username does not match token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      if (result.current) {
        expect(result.current.isLoading).toBe(false)
      }
    })

    let error: Error | undefined
    try {
      await act(async () => {
        if (result.current) {
          await result.current.login('wronguser', 'valid-token')
        }
      })
    } catch (e) {
      error = e as Error
    }

    expect(error).toBeDefined()
    expect(error?.message).toBe('Username does not match token')
  })

  it('handles getUserProfile failure gracefully during login', async () => {
    server.use(
      http.get('https://api.discogs.com/users/:username', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.login('testuser', 'valid-token')
    })

    // Should still login successfully even if profile fetch fails
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('testuser')
  })

  it('validates token on mount and authenticates if valid', async () => {
    setToken('valid-token')
    setUsername('testuser')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('testuser')
  })

  it('clears auth on mount when token is invalid', async () => {
    setToken('invalid-token')
    setUsername('testuser')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.username).toBeNull()
    expect(localStorage.getItem('vinylview_token')).toBeNull()
  })

  it('handles getUserProfile failure on mount by using cached profile', async () => {
    setToken('valid-token')
    setUsername('testuser')

    server.use(
      http.get('https://api.discogs.com/users/:username', () => {
        return new HttpResponse(null, { status: 500 })
      })
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    // Should still authenticate even if profile fetch fails
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.username).toBe('testuser')
  })

  it('clears auth when no token exists on mount', async () => {
    setUsername('testuser')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('vinylview_username')).toBeNull()
  })

  it('clears auth when no username exists on mount', async () => {
    setToken('valid-token')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('vinylview_token')).toBeNull()
  })
})
