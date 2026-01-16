import { createContext } from 'react'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  userId: number | null
}

export interface AuthContextValue extends AuthState {
  login: (username: string, token: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
