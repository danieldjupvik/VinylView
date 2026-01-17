import { createContext } from 'react'

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  userId: number | null
  avatarUrl: string | null
}

export interface AuthContextValue extends AuthState {
  login: (username: string, token: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
