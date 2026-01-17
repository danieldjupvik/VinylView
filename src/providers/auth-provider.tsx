import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userId: null,
    avatarUrl: null
  })

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
        const storedIdentity = getStoredIdentity()
        const storedProfile = getStoredUserProfile()

        if (!gravatarEmail && storedProfile?.email) {
          setGravatarEmail(storedProfile.email)
        }

        if (storedIdentity) {
          if (!storedProfile) {
            try {
              const profile = await getUserProfile(storedIdentity.username)
              setStoredUserProfile(profile)
              if (!gravatarEmail && profile.email) {
                setGravatarEmail(profile.email)
              }
              setState({
                isAuthenticated: true,
                isLoading: false,
                username: storedIdentity.username,
                userId: storedIdentity.id,
                avatarUrl:
                  profile.avatar_url ?? storedIdentity.avatar_url ?? null
              })
              return
            } catch {
              // Fall back to stored identity only
            }
          }
          setState({
            isAuthenticated: true,
            isLoading: false,
            username: storedIdentity.username,
            userId: storedIdentity.id,
            avatarUrl:
              storedProfile?.avatar_url ?? storedIdentity.avatar_url ?? null
          })
          return
        }

        const identity = await fetchIdentity()
        setStoredIdentity(identity)
        let profile: DiscogsUserProfile | null = null
        try {
          profile = await getUserProfile(identity.username)
          setStoredUserProfile(profile)
        } catch {
          profile = null
        }
        if (!gravatarEmail && profile?.email) {
          setGravatarEmail(profile.email)
        }
        setState({
          isAuthenticated: true,
          isLoading: false,
          username: identity.username,
          userId: identity.id,
          avatarUrl: profile?.avatar_url ?? identity.avatar_url ?? null
        })
      } catch {
        // Token is invalid, clear it
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
  }, [gravatarEmail, setGravatarEmail])

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

      let profile: DiscogsUserProfile | null = null
      try {
        profile = await getUserProfile(identity.username)
      } catch {
        profile = null
      }

      // Store credentials and update state
      setToken(token)
      setUsername(identity.username)
      setStoredIdentity(identity)
      if (profile) {
        setStoredUserProfile(profile)
      }
      if (!gravatarEmail && profile?.email) {
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
    [gravatarEmail, setGravatarEmail]
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
