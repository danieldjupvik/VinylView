import {
  createMemoryHistory,
  createRouter,
  RouterProvider
} from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { SESSION_STORAGE_KEYS } from '@/lib/constants'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { QueryProvider } from '@/providers/query-provider'
import { ThemeProvider } from '@/providers/theme-provider'
import { routeTree } from '@/routeTree.gen'

const renderApp = (initialPath: string) => {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    defaultViewTransition: false
  })

  render(
    <ThemeProvider defaultTheme="dark" storageKey="vinyldeck-theme">
      <QueryProvider>
        <PreferencesProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </PreferencesProvider>
      </QueryProvider>
    </ThemeProvider>
  )

  return router
}

describe('auth flow', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('redirects unauthenticated users to login', async () => {
    renderApp('/collection')

    expect(
      await screen.findByRole('button', { name: /sign in/i })
    ).toBeInTheDocument()
  })

  it('logs in and navigates to collection', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await screen.findByLabelText(/username/i)
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(
      screen.getByLabelText(/personal access token/i),
      'valid-token'
    )
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByRole('heading', { name: /my collection/i })
    ).toBeInTheDocument()
    expect(localStorage.getItem('vinyldeck_token')).toBe('valid-token')
  })

  it('stores redirect URL when accessing protected route while unauthenticated', async () => {
    renderApp('/collection?style=Rock')

    await screen.findByRole('button', { name: /sign in/i })

    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)).toBe(
      '/collection?style=Rock'
    )
  })

  it('redirects to stored URL after login', async () => {
    const user = userEvent.setup()
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.REDIRECT_URL,
      '/collection?style=Rock'
    )
    renderApp('/login')

    await screen.findByLabelText(/username/i)
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(
      screen.getByLabelText(/personal access token/i),
      'valid-token'
    )
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByRole('heading', { name: /my collection/i })
    ).toBeInTheDocument()
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.REDIRECT_URL)).toBeNull()
  })
})
