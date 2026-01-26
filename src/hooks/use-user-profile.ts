import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { trpc } from '@/lib/trpc'

export interface UserProfile {
  id: number
  username: string
  avatar_url?: string
  email?: string
}

/** Query key for user profile cache */
export const USER_PROFILE_QUERY_KEY = ['userProfile'] as const

/**
 * Manages user profile data via TanStack Query cache.
 * Profile is persisted to IndexedDB for offline access.
 *
 * - Data is set manually via fetchProfile(), not via useQuery's queryFn
 * - Call fetchProfile() on login/continue/reconnect
 * - Profile is cleared when disconnect() is called
 *
 * Uses useQuery with enabled: false to subscribe to cache updates
 * (including IndexedDB hydration) while preventing automatic fetches.
 */
export function useUserProfile(): {
  profile: UserProfile | undefined
  isFetching: boolean
  error: Error | null
  fetchProfile: (
    username: string,
    tokens: { accessToken: string; accessTokenSecret: string }
  ) => Promise<UserProfile>
  clearProfile: () => void
} {
  const queryClient = useQueryClient()
  const trpcUtils = trpc.useUtils()
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Subscribe to profile cache updates (including IndexedDB restoration).
  // Pattern: enabled: false + passthrough queryFn
  //
  // Why this pattern?
  // - enabled: false prevents automatic fetching (we control when via fetchProfile())
  // - queryFn is required by TanStack Query even when disabled, so we use a passthrough
  //   that returns existing cache data. This is never actually called since enabled: false.
  // - useQuery subscription triggers re-renders when cache updates (via setQueryData or
  //   IndexedDB hydration), giving us reactive profile state without automatic fetches.
  const { data: profileData } = useQuery<UserProfile | null>({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: () =>
      queryClient.getQueryData<UserProfile>(USER_PROFILE_QUERY_KEY) ?? null,
    enabled: false,
    staleTime: Infinity
  })

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
    setError(null)
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

      queryClient.setQueryData(USER_PROFILE_QUERY_KEY, userProfile)
      return userProfile
    } catch (err) {
      const fetchError =
        err instanceof Error ? err : new Error('Failed to fetch profile')
      setError(fetchError)
      throw fetchError
    } finally {
      setIsFetching(false)
    }
  }

  /**
   * Clears profile from cache.
   * Called during disconnect flow.
   */
  const clearProfile = () => {
    queryClient.removeQueries({ queryKey: USER_PROFILE_QUERY_KEY })
  }

  return {
    profile: profileData ?? undefined,
    isFetching,
    error,
    fetchProfile,
    clearProfile
  }
}
