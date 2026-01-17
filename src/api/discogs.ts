import { apiClient } from './client'
import { COLLECTION } from '@/lib/constants'
import type {
  DiscogsIdentity,
  DiscogsCollectionResponse,
  DiscogsUserProfile,
  CollectionParams
} from '@/types/discogs'

/**
 * Validate token and get user identity
 */
export async function getIdentity(): Promise<DiscogsIdentity> {
  const response = await apiClient.get<DiscogsIdentity>('/oauth/identity')
  return response.data
}

/**
 * Get a user profile by username
 */
export async function getUserProfile(
  username: string
): Promise<DiscogsUserProfile> {
  const response = await apiClient.get<DiscogsUserProfile>(`/users/${username}`)
  return response.data
}

/**
 * Validate credentials by attempting to get identity
 * Returns the identity if valid, throws if invalid
 */
export async function validateCredentials(
  token: string
): Promise<DiscogsIdentity> {
  const response = await apiClient.get<DiscogsIdentity>('/oauth/identity', {
    headers: {
      Authorization: `Discogs token=${token}`
    }
  })
  return response.data
}

/**
 * Get user's collection releases
 */
export async function getCollection(
  username: string,
  params: CollectionParams = {}
): Promise<DiscogsCollectionResponse> {
  const { page = 1, perPage = COLLECTION.PER_PAGE, sort, sortOrder } = params

  const response = await apiClient.get<DiscogsCollectionResponse>(
    `/users/${username}/collection/folders/0/releases`,
    {
      params: {
        page,
        per_page: perPage,
        sort: sort ?? undefined,
        sort_order: sortOrder ?? undefined
      }
    }
  )

  return response.data
}

/**
 * Check if a release is a vinyl record
 */
export function isVinylRecord(formats: { name: string }[]): boolean {
  return formats.some((format) => format.name === 'Vinyl')
}
