import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  validateCredentials,
  getIdentity as fetchIdentity,
  getUserProfile
} from '@/api/discogs'
import {
  getToken,
  getUsername,
  getStoredUserProfile,
  getStoredIdentity,
  setToken,
  setStoredUserProfile,
  setStoredIdentity,
  setUsername,
  clearAuth
} from '@/lib/storage'
import { AuthContext, type AuthState } from './auth-context'
import type { DiscogsIdentity, DiscogsUserProfile } from '@/types/discogs'
import { usePreferences } from '@/hooks/use-preferences'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { gravatarEmail, setGravatarEmail } = usePreferences()
  const latestGravatarEmailRef = useRef(gravatarEmail)
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userId: null,
    avatarUrl: null
  })

  useEffect(() => {
    latestGravatarEmailRef.current = gravatarEmail
  }, [gravatarEmail])

  // Validate existing token on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = getToken()
      const storedUsername = getUsername()

      if (!token || !storedUsername) {
        clearAuth()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null
        })
        return
      }

      try {
        // Always validate the token by fetching fresh identity
        // This ensures expired or invalid tokens are caught
        const identity = await fetchIdentity()
        setStoredIdentity(identity)

        // Fetch user profile (use cached email if available)
        const storedProfile = getStoredUserProfile()
        let profile: DiscogsUserProfile | null = null
        try {
          profile = await getUserProfile(identity.username)
          setStoredUserProfile(profile)
        } catch {
          // If profile fetch fails, use cached profile if available
          profile = storedProfile
        }

        // Update gravatar email from profile if not already set
        if (!latestGravatarEmailRef.current && profile?.email) {
          latestGravatarEmailRef.current = profile.email
          setGravatarEmail(profile.email)
        }

        // Set authenticated state with validated data
        setState({
          isAuthenticated: true,
          isLoading: false,
          username: identity.username,
          userId: identity.id,
          avatarUrl: profile?.avatar_url ?? identity.avatar_url ?? null
        })
      } catch {
        // Token is invalid or expired, clear everything
        clearAuth()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null,
          avatarUrl: null
        })
      }
    }

    validateSession()
  }, [setGravatarEmail])

  const login = useCallback(
    async (username: string, token: string): Promise<void> => {
      // Validate the credentials first
      let identity: DiscogsIdentity
      try {
        identity = await validateCredentials(token)
      } catch {
        throw new Error('Invalid credentials')
      }

      // Verify username matches
      if (identity.username.toLowerCase() !== username.toLowerCase()) {
        throw new Error('Username does not match token')
      }

      // Store token BEFORE calling getUserProfile so the API client can use it
      setToken(token)
      setUsername(identity.username)

      let profile: DiscogsUserProfile | null = null
      try {
        profile = await getUserProfile(identity.username)
      } catch {
        profile = null
      }

      // Store identity and profile
      setStoredIdentity(identity)
      if (profile) {
        setStoredUserProfile(profile)
      }
      if (!latestGravatarEmailRef.current && profile?.email) {
        latestGravatarEmailRef.current = profile.email
        setGravatarEmail(profile.email)
      }
      setState({
        isAuthenticated: true,
        isLoading: false,
        username: identity.username,
        userId: identity.id,
        avatarUrl: profile?.avatar_url ?? identity.avatar_url ?? null
      })
    },
    [setGravatarEmail]
  )

  const logout = useCallback(() => {
    clearAuth()
    setState({
      isAuthenticated: false,
      isLoading: false,
      username: null,
      userId: null,
      avatarUrl: null
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
