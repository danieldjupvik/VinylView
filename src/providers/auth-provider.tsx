import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { validateCredentials, getIdentity } from '@/api/discogs'
import {
  getToken,
  getUsername,
  setToken,
  setUsername,
  clearAuth
} from '@/lib/storage'
import { AuthContext } from './auth-context'
import type { DiscogsIdentity } from '@/types/discogs'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  userId: number | null
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    username: null,
    userId: null
  })

  // Validate existing token on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = getToken()
      const storedUsername = getUsername()

      if (!token || !storedUsername) {
        setState((prev) => ({ ...prev, isLoading: false }))
        return
      }

      try {
        const identity = await getIdentity()
        setState({
          isAuthenticated: true,
          isLoading: false,
          username: identity.username,
          userId: identity.id
        })
      } catch {
        // Token is invalid, clear it
        clearAuth()
        setState({
          isAuthenticated: false,
          isLoading: false,
          username: null,
          userId: null
        })
      }
    }

    validateSession()
  }, [])

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

      // Store credentials and update state
      setToken(token)
      setUsername(identity.username)
      setState({
        isAuthenticated: true,
        isLoading: false,
        username: identity.username,
        userId: identity.id
      })
    },
    []
  )

  const logout = useCallback(() => {
    clearAuth()
    setState({
      isAuthenticated: false,
      isLoading: false,
      username: null,
      userId: null
    })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
