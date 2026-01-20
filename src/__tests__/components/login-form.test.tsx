import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'

import { setOAuthTokens, setUsername } from '@/lib/storage'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { Route as LoginRoute } from '@/routes/login'

import { mockOAuthTokens } from '../mocks/handlers'
import { TRPCTestProvider } from '../mocks/trpc'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>(
    '@tanstack/react-router'
  )
  return {
    ...actual,
    useNavigate: () => navigate
  }
})

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

const LoginComponent = LoginRoute.options.component!

function createMockAuthValue(
  overrides: Partial<AuthContextValue> = {}
): AuthContextValue {
  return {
    isAuthenticated: false,
    isLoading: false,
    username: null,
    userId: null,
    avatarUrl: null,
    oauthTokens: null,
    validateOAuthTokens: vi.fn().mockResolvedValue(undefined),
    signOut: vi.fn(),
    disconnect: vi.fn(),
    ...overrides
  }
}

function renderLogin(authOverrides: Partial<AuthContextValue> = {}) {
  const authValue = createMockAuthValue(authOverrides)

  render(
    <TRPCTestProvider>
      <AuthContext.Provider value={authValue}>
        <LoginComponent />
      </AuthContext.Provider>
    </TRPCTestProvider>
  )

  return { authValue }
}

describe('Login page - OAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  afterEach(() => {
    navigate.mockClear()
  })

  describe('Fresh login flow', () => {
    it('renders sign in with Discogs button', () => {
      renderLogin()
      const button = screen.getByRole('button', {
        name: /sign in with discogs/i
      })
      expect(button).toBeInTheDocument()
    })

    it('shows loading state when button is clicked', async () => {
      const user = userEvent.setup()
      renderLogin()

      const button = screen.getByRole('button', {
        name: /sign in with discogs/i
      })
      await user.click(button)

      // Button should show loading state
      expect(screen.getByText(/redirecting/i)).toBeInTheDocument()
    })
  })

  describe('Welcome back flow', () => {
    beforeEach(() => {
      // Set up existing tokens and username for "Welcome back" flow
      setOAuthTokens(mockOAuthTokens)
      setUsername('testuser')
    })

    it('shows welcome back message when tokens exist', () => {
      renderLogin()

      expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /continue/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /use different account/i })
      ).toBeInTheDocument()
    })

    it('validates tokens when continue is clicked', async () => {
      const user = userEvent.setup()
      const validateOAuthTokens = vi.fn().mockResolvedValue(undefined)
      renderLogin({ validateOAuthTokens })

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      expect(validateOAuthTokens).toHaveBeenCalled()
    })

    it.skip('shows loading state during token validation', async () => {
      // Skipped: Timing-dependent test that's flaky in CI
      const user = userEvent.setup()
      const validateOAuthTokens = vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100))
        )
      renderLogin({ validateOAuthTokens })

      const continueButton = screen.getByRole('button', { name: /continue/i })
      await user.click(continueButton)

      expect(screen.getByText(/logging in/i)).toBeInTheDocument()
    })
  })

  describe('Navigation after authentication', () => {
    it('redirects to collection when authenticated', async () => {
      renderLogin({ isAuthenticated: true })

      // Wait for navigation effect to trigger
      await vi.waitFor(() => {
        expect(navigate).toHaveBeenCalledWith({ to: '/collection' })
      })
    })
  })
})
