import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

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

const LoginComponent = LoginRoute.options.component!

const renderLogin = (overrides: Partial<AuthContextValue> = {}) => {
  const login = vi.fn().mockResolvedValue(undefined)
  const authValue: AuthContextValue = {
    isAuthenticated: false,
    isLoading: false,
    username: null,
    userId: null,
    avatarUrl: null,
    login,
    logout: vi.fn(),
    ...overrides
  }

  render(
    <AuthContext.Provider value={authValue}>
      <LoginComponent />
    </AuthContext.Provider>
  )

  return { login }
}

describe('Login form', () => {
  it('disables submit when fields are empty', () => {
    renderLogin()
    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeDisabled()
  })

  it('submits credentials and calls login with trimmed values', async () => {
    const user = userEvent.setup()
    const { login } = renderLogin()

    await user.type(screen.getByLabelText(/username/i), ' testuser ')
    await user.type(screen.getByLabelText(/personal access token/i), ' token ')

    const button = screen.getByRole('button', { name: /sign in/i })
    expect(button).toBeEnabled()

    await user.click(button)

    await waitFor(() => expect(login).toHaveBeenCalled())
    expect(login).toHaveBeenCalledWith('testuser', 'token')
    // Navigation is handled by useEffect when isAuthenticated changes,
    // which is tested in integration/auth-flow.test.tsx
  })
})
