import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createInstance } from 'i18next'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it, vi } from 'vitest'

import { APP_VERSION } from '@/lib/constants'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import {
  PreferencesContext,
  type PreferencesContextValue
} from '@/providers/preferences-context'
import {
  ThemeProviderContext,
  type ThemeProviderState
} from '@/providers/theme-context'
import { Route as SettingsRoute } from '@/routes/_authenticated/settings'

const SettingsComponent = SettingsRoute.options.component!

// Initialize a minimal i18n instance for testing
const i18nInstance = createInstance()
void i18nInstance.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        'app.name': 'VinylDeck',
        'app.description': 'Browse your Discogs vinyl collection',
        'settings.title': 'Settings',
        'settings.subtitle': 'Manage your profile and app preferences',
        'settings.version': 'Version',
        'settings.profile.title': 'Profile',
        'settings.profile.description':
          'Personalize how your profile appears in VinylDeck',
        'settings.profile.avatar.title': 'Avatar',
        'settings.profile.avatar.description':
          'Choose the avatar shown in the sidebar and menus.',
        'settings.profile.avatar.discogs': 'Discogs avatar',
        'settings.profile.avatar.discogsHint':
          'Uses your Discogs profile image',
        'settings.profile.avatar.gravatar': 'Gravatar',
        'settings.profile.avatar.gravatarHint':
          'Uses a Gravatar linked to your email',
        'settings.appearance.title': 'Appearance',
        'settings.appearance.description':
          'Customize how VinylDeck looks and feels',
        'settings.appearance.theme.title': 'Theme',
        'settings.appearance.theme.description':
          'Select your preferred color scheme.',
        'settings.appearance.theme.light': 'Light',
        'settings.appearance.theme.lightHint': 'A bright, clean look',
        'settings.appearance.theme.dark': 'Dark',
        'settings.appearance.theme.darkHint': 'Easy on the eyes',
        'settings.appearance.theme.system': 'System',
        'settings.appearance.theme.systemHint': 'Matches your device settings',
        'settings.appearance.language.title': 'Language',
        'settings.appearance.language.description':
          'Choose your preferred language.',
        'settings.appearance.language.english': 'English',
        'settings.appearance.language.englishHint': 'English (US)',
        'settings.appearance.language.norwegian': 'Norwegian',
        'settings.appearance.language.norwegianHint': 'Norsk (Bokmål)',
        'settings.about.title': 'About',
        'settings.about.description': 'Information about the app',
        'settings.about.changelog': 'Changelog',
        'settings.about.privacy': 'Privacy Policy',
        'settings.about.terms': 'Terms of Service',
        'common.comingSoon': '(Coming soon)'
      }
    }
  }
})

const renderSettings = (
  authOverrides: Partial<AuthContextValue> = {},
  prefsOverrides: Partial<PreferencesContextValue> = {},
  themeOverrides: Partial<ThemeProviderState> = {}
) => {
  const setAvatarSource = vi.fn()
  const setTheme = vi.fn()
  const authValue: AuthContextValue = {
    isAuthenticated: true,
    isLoading: false,
    username: 'testuser',
    userId: 123,
    avatarUrl: 'https://example.com/avatar.jpg',
    oauthTokens: null,
    validateOAuthTokens: vi.fn(),
    signOut: vi.fn(),
    disconnect: vi.fn(),
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

  const themeValue: ThemeProviderState = {
    theme: 'system',
    setTheme,
    ...themeOverrides
  }

  render(
    <I18nextProvider i18n={i18nInstance}>
      <AuthContext.Provider value={authValue}>
        <PreferencesContext.Provider value={prefsValue}>
          <ThemeProviderContext.Provider value={themeValue}>
            <SettingsComponent />
          </ThemeProviderContext.Provider>
        </PreferencesContext.Provider>
      </AuthContext.Provider>
    </I18nextProvider>
  )

  return { setAvatarSource, setTheme }
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

  it('displays app version in about section', () => {
    renderSettings()
    expect(screen.getByText('Version')).toBeInTheDocument()
    expect(screen.getByText(APP_VERSION)).toBeInTheDocument()
  })

  // Theme selection tests
  describe('Theme Selection', () => {
    it('renders theme section with title and description', () => {
      renderSettings()
      expect(screen.getByText('Theme')).toBeInTheDocument()
      expect(
        screen.getByText(/select your preferred color scheme/i)
      ).toBeInTheDocument()
    })

    it('displays all three theme options', () => {
      renderSettings()
      expect(
        screen.getByRole('button', { name: /light.*bright/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /dark.*easy on the eyes/i })
      ).toBeInTheDocument()
      expect(
        screen.getByRole('button', { name: /system.*matches your device/i })
      ).toBeInTheDocument()
    })

    it('highlights the selected theme option', () => {
      renderSettings({}, {}, { theme: 'dark' })
      const darkButton = screen.getByRole('button', {
        name: /dark.*easy on the eyes/i
      })
      expect(darkButton).toHaveClass('border-primary/60')
    })

    it('calls setTheme when a theme option is clicked', async () => {
      const user = userEvent.setup()
      const { setTheme } = renderSettings({}, {}, { theme: 'system' })

      const lightButton = screen.getByRole('button', { name: /light.*bright/i })
      await user.click(lightButton)

      expect(setTheme).toHaveBeenCalledWith('light')
    })
  })

  // Language selection tests
  describe('Language Selection', () => {
    it('renders language section with title and description', () => {
      renderSettings()
      expect(screen.getByText('Language')).toBeInTheDocument()
      expect(
        screen.getByText(/choose your preferred language/i)
      ).toBeInTheDocument()
    })

    it('displays language select with current language', () => {
      renderSettings()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
    })
  })

  // About section tests
  describe('About Section', () => {
    it('renders about section with title and description', () => {
      renderSettings()
      expect(screen.getByText('About')).toBeInTheDocument()
      expect(screen.getByText(/information about the app/i)).toBeInTheDocument()
    })

    it('displays changelog, privacy, and terms placeholders', () => {
      renderSettings()
      expect(screen.getByText('Changelog')).toBeInTheDocument()
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })

    it('shows coming soon labels on disabled items', () => {
      renderSettings()
      const comingSoonLabels = screen.getAllByText('(Coming soon)')
      expect(comingSoonLabels).toHaveLength(3)
    })

    it('has disabled buttons for changelog, privacy, and terms', () => {
      renderSettings()
      const changelogButton = screen.getByText('Changelog').closest('button')
      const privacyButton = screen.getByText('Privacy Policy').closest('button')
      const termsButton = screen.getByText('Terms of Service').closest('button')

      expect(changelogButton).toBeDisabled()
      expect(privacyButton).toBeDisabled()
      expect(termsButton).toBeDisabled()
    })
  })
})
