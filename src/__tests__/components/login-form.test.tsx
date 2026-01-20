import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { Route as LoginRoute } from '@/routes/login'

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

// Mock tRPC for OAuth flow
vi.mock('@/lib/trpc', () => ({
  trpc: {
    oauth: {
      getRequestToken: {
        useMutation: () => ({
          mutateAsync: vi.fn(),
          isPending: false
        })
      }
    }
  }
}))

const LoginComponent = LoginRoute.options.component!

const renderLogin = (overrides: Partial<AuthContextValue> = {}) => {
  const validateOAuthTokens = vi.fn().mockResolvedValue(undefined)
  const authValue: AuthContextValue = {
    isAuthenticated: false,
    isLoading: false,
    username: null,
    userId: null,
    avatarUrl: null,
    oauthTokens: null,
    validateOAuthTokens,
    logout: vi.fn(),
    ...overrides
  }

  render(
    <AuthContext.Provider value={authValue}>
      <LoginComponent />
    </AuthContext.Provider>
  )

  return { validateOAuthTokens }
}

// TODO: These tests need to be rewritten for OAuth flow
// The old PAT-based login form tests are no longer applicable.
// The login page now shows an OAuth button instead of username/token fields.
// New tests should:
// 1. Test that "Sign in with Discogs" button is rendered
// 2. Test that clicking the button triggers OAuth flow
// 3. Test loading states during OAuth redirect
describe('Login page - OAuth', () => {
  afterEach(() => {
    navigate.mockClear()
  })

  it('renders sign in with Discogs button', () => {
    renderLogin()
    const button = screen.getByRole('button', { name: /sign in with discogs/i })
    expect(button).toBeInTheDocument()
  })

  it.skip('initiates OAuth flow when button is clicked', async () => {
    // TODO: Test that clicking button calls trpc.oauth.getRequestToken
    // and redirects to Discogs authorization URL
  })

  it.skip('shows loading state during OAuth redirect', async () => {
    // TODO: Test loading spinner/disabled state while redirecting
  })
})
