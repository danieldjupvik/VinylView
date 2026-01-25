import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { trpc } from '@/lib/trpc'

export interface UserProfile {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

/**
 * Manages user profile data via TanStack Query cache.
 * Profile is persisted to IndexedDB for offline access.
 *
 * - Data is set manually via fetchProfile(), not via useQuery
 * - Call fetchProfile() on login/continue/reconnect
 * - Profile is cleared when disconnect() is called
 *
 * Note: We use queryClient directly instead of useQuery because:
 * 1. Profile should only be fetched explicitly, not via refetch()
 * 2. We need to pass tokens directly (not read from store) to avoid timing issues
 * 3. We want manual control over loading state
 */
export function useUserProfile(): {
  profile: UserProfile | undefined
  isFetching: boolean
  fetchProfile: (
    username: string,
    tokens: { accessToken: string; accessTokenSecret: string }
  ) => Promise<UserProfile>
  clearProfile: () => void
} {
  const queryClient = useQueryClient()
  const trpcUtils = trpc.useUtils()
  const [isFetching, setIsFetching] = useState(false)

  // Read profile directly from query cache
  const profile = queryClient.getQueryData<UserProfile>(['userProfile'])

  /**
   * Fetches profile from API and caches it.
   * Call after successful token validation.
   *
   * @param username - The username to fetch profile for
   * @param tokens - OAuth tokens to use for the request (passed directly to avoid store timing issues)
   * @returns The fetched user profile
   */
  const fetchProfile = async (
    username: string,
    tokens: { accessToken: string; accessTokenSecret: string }
  ): Promise<UserProfile> => {
    setIsFetching(true)
    try {
      const { profile } = await trpcUtils.client.discogs.getUserProfile.query({
        accessToken: tokens.accessToken,
        accessTokenSecret: tokens.accessTokenSecret,
        username
      })

      const userProfile: UserProfile = {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        // Only include email if defined (exactOptionalPropertyTypes compliance)
        ...(profile.email !== undefined && { email: profile.email })
      }

      queryClient.setQueryData(['userProfile'], userProfile)
      return userProfile
    } finally {
      setIsFetching(false)
    }
  }

  /**
   * Clears profile from cache.
   * Called during disconnect flow.
   */
  const clearProfile = () => {
    queryClient.removeQueries({ queryKey: ['userProfile'] })
  }

  return {
    profile,
    isFetching,
    fetchProfile,
    clearProfile
  }
}
