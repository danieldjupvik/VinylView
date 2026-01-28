import { useContext } from 'react'

import { AuthContext, type AuthContextValue } from '@/providers/auth-context'

/**
 * Hook to access authentication state and actions.
 *
 * @returns Authentication context value
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
