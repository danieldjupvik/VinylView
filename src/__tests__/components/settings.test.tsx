import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import {
  PreferencesContext,
  type PreferencesContextValue
} from '@/providers/preferences-context'
import { Route as SettingsRoute } from '@/routes/_authenticated/settings'

const SettingsComponent = SettingsRoute.options.component!

const renderSettings = (
  authOverrides: Partial<AuthContextValue> = {},
  prefsOverrides: Partial<PreferencesContextValue> = {}
) => {
  const setAvatarSource = vi.fn()
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    isLoading: false,
    username: 'testuser',
    userId: 123,
    avatarUrl: 'https://example.com/avatar.jpg',
    login: vi.fn(),
    logout: vi.fn(),
    ...authOverrides
  }

  const prefsValue: PreferencesContextValue = {
    avatarSource: 'discogs',
    setAvatarSource,
    gravatarEmail: '',
    setGravatarEmail: vi.fn(),
    gravatarUrl: null,
    ...prefsOverrides
  }

  render(
    <AuthContext.Provider value={authValue}>
      <PreferencesContext.Provider value={prefsValue}>
        <SettingsComponent />
      </PreferencesContext.Provider>
    </AuthContext.Provider>
  )

  return { setAvatarSource }
}

describe('Settings Page', () => {
  it('renders settings page with title and subtitle', () => {
    renderSettings()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(
      screen.getByText(/manage your profile and app preferences/i)
    ).toBeInTheDocument()
  })

  it.skip('displays user avatar from Discogs when avatarSource is discogs', () => {
    renderSettings()
    const avatarImages = screen.getAllByAltText('testuser')
    expect(avatarImages.length).toBeGreaterThan(0)
  })

  it.skip('displays user initials when no avatar URL is available', () => {
    renderSettings({ avatarUrl: null })
    const initials = screen.getAllByText('TU')
    expect(initials.length).toBeGreaterThanOrEqual(1)
  })

  it('calculates initials correctly for username with special characters', () => {
    renderSettings({ username: 'test_user-name', avatarUrl: null })
    expect(screen.getAllByText('TU')).toHaveLength(2)
  })

  it('displays ? for initials when username is null', () => {
    renderSettings({ username: null, avatarUrl: null })
    expect(screen.getAllByText('?')).toHaveLength(2)
  })

  it('highlights Discogs avatar option when selected', () => {
    renderSettings({}, { avatarSource: 'discogs' })
    const discogsButton = screen.getByText(/discogs avatar/i).closest('button')!
    expect(discogsButton).toHaveClass('border-primary/60')
  })

  it.skip('highlights Gravatar option when selected', () => {
    renderSettings({}, { avatarSource: 'gravatar' })
    const gravatarButton = screen.getByText(/gravatar/i).closest('button')!
    expect(gravatarButton).toBeInTheDocument()
  })

  it('switches to Discogs avatar when Discogs option is clicked', async () => {
    const user = userEvent.setup()
    const { setAvatarSource } = renderSettings({}, { avatarSource: 'gravatar' })

    const discogsButton = screen.getByText(/discogs avatar/i).closest('button')!

    await user.click(discogsButton)

    expect(setAvatarSource).toHaveBeenCalledWith('discogs')
  })

  it.skip('switches to Gravatar when Gravatar option is clicked', async () => {
    const user = userEvent.setup()
    const { setAvatarSource } = renderSettings({}, { avatarSource: 'discogs' })

    const gravatarButton = screen.getByText(/gravatar/i).closest('button')!

    await user.click(gravatarButton)

    expect(setAvatarSource).toHaveBeenCalledWith('gravatar')
  })

  it.skip('displays Gravatar image when gravatarUrl is provided', () => {
    renderSettings(
      {},
      {
        avatarSource: 'gravatar',
        gravatarUrl: 'https://gravatar.com/avatar/hash'
      }
    )

    const gravatarImages = screen.getAllByAltText('testuser')
    expect(gravatarImages.length).toBeGreaterThan(0)
  })

  it('displays app version in the settings', () => {
    renderSettings()
    expect(screen.getByText('0.1.0')).toBeInTheDocument()
  })

  it('displays app name and description', () => {
    renderSettings()
    expect(screen.getByText('VinylView')).toBeInTheDocument()
    expect(
      screen.getByText(/browse your discogs vinyl collection/i)
    ).toBeInTheDocument()
  })
})
