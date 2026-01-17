import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  createMemoryHistory,
  createRouter,
  RouterProvider
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/providers/auth-provider'
import { PreferencesProvider } from '@/providers/preferences-provider'
import { ThemeProvider } from '@/providers/theme-provider'

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
})
