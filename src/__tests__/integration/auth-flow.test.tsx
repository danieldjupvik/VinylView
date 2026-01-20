import {
  createMemoryHistory,
  createRouter,
  RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { SESSION_STORAGE_KEYS } from '@/lib/constants'
import { setOAuthTokens, setSessionActive } from '@/lib/storage'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { routeTree } from '@/routeTree.gen'

import { mockOAuthTokens } from '../mocks/handlers'
import { TRPCTestProvider } from '../mocks/trpc'

/**
 * Renders the full app with all providers for integration testing.
 */
function renderApp(initialPath: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultViewTransition: false
  })

  render(
    <ThemeProvider defaultTheme="dark" storageKey="vinyldeck-theme">
      <TRPCTestProvider>
        <PreferencesProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </PreferencesProvider>
      </TRPCTestProvider>
    </ThemeProvider>
  )

  return router
}

describe('Auth flow integration', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  describe('Unauthenticated access', () => {
    it('redirects unauthenticated users to login', async () => {
      renderApp('/collection')

      // Should show sign in button on login page
      expect(
        await screen.findByRole('button', { name: /sign in/i })
      ).toBeInTheDocument()
    })

    it('stores redirect URL when accessing protected route while unauthenticated', async () => {
      renderApp('/collection?style=Rock')

      await screen.findByRole('button', { name: /sign in/i })

      expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)).toBe(
        '/collection?style=Rock'
      )
    })
  })

  describe('Authenticated access', () => {
    beforeEach(() => {
      // Set up authenticated session
      setOAuthTokens(mockOAuthTokens)
      setSessionActive(true)
    })

    // These tests require full tRPC/MSW integration which is complex to set up.
    // The AuthProvider validates tokens via tRPC on mount, which MSW doesn't intercept properly.
    it.skip('shows collection page when authenticated', async () => {
      // TODO: Implement when tRPC/MSW integration is properly configured
      renderApp('/collection')
      expect(
        await screen.findByRole('heading', { name: /my collection/i })
      ).toBeInTheDocument()
    })

    it.skip('shows settings page when authenticated', async () => {
      // TODO: Implement when tRPC/MSW integration is properly configured
      renderApp('/settings')
      expect(await screen.findByText(/appearance/i)).toBeInTheDocument()
    })
  })

  describe('Session management', () => {
    it('shows welcome back flow when tokens exist but session not active', async () => {
      // Tokens exist but session is not active (user signed out)
      setOAuthTokens(mockOAuthTokens)
      localStorage.setItem('vinyldeck_username', 'testuser')
      // Session is NOT active

      renderApp('/login')

      // Should show "Welcome back" flow
      expect(await screen.findByText(/welcome back/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /continue/i })
      ).toBeInTheDocument()
    })
  })
})
