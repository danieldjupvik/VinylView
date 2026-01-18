import { apiClient } from './client'
import { COLLECTION } from '@/lib/constants'
import type {
  DiscogsIdentity,
  DiscogsCollectionResponse,
  DiscogsUserProfile,
  CollectionParams,
  DiscogsWantlistResponse,
  DiscogsRelease,
  DiscogsMasterRelease,
  DiscogsCollectionValue,
  DiscogsOAuthRequestToken,
  DiscogsOAuthAccessToken,
  DiscogsUserProfileUpdate,
  DiscogsWantlistAddRequest,
  DiscogsWantlistAddResponse,
  DiscogsCollectionFoldersResponse,
  DiscogsCollectionFolder,
  DiscogsCollectionFieldsResponse,
  DiscogsReleaseRatingByUser,
  DiscogsCommunityReleaseRating,
  DiscogsReleaseStats,
  DiscogsMasterVersionsResponse,
  DiscogsSearchResponse,
  SearchParams,
  DiscogsMarketplaceFee,
  DiscogsPriceSuggestionsResponse,
  DiscogsMarketplaceStats
} from '@/types/discogs'

/**
 * ==============================================================================
 * Authentication
 * ==============================================================================
 * This section describes the various methods of authenticating with the Discogs API.
 */

/**
 * Request Token URL
 * Generate the request token.
 *
 * GET /oauth/request_token
 */
export async function getOAuthRequestToken(
  consumerKey: string,
  consumerSecret: string,
  callbackUrl: string
): Promise<DiscogsOAuthRequestToken> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = Math.random().toString(36).substring(2)
  const encodedCallbackUrl = encodeURIComponent(callbackUrl)

  const authHeader =
    `OAuth oauth_consumer_key="${consumerKey}", ` +
    `oauth_nonce="${nonce}", ` +
    `oauth_signature="${consumerSecret}&", ` +
    `oauth_signature_method="PLAINTEXT", ` +
    `oauth_timestamp="${timestamp}", ` +
    `oauth_callback="${encodedCallbackUrl}"`

  const response = await apiClient.get<string>('/oauth/request_token', {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    // Discogs returns form-urlencoded string, not JSON
    responseType: 'text'
  })

  // Parse the response body
  const params = new URLSearchParams(response.data)
  return {
    oauth_token: params.get('oauth_token') ?? '',
    oauth_token_secret: params.get('oauth_token_secret') ?? '',
    oauth_callback_confirmed: params.get('oauth_callback_confirmed') ?? 'false'
  }
}

/**
 * Access Token URL
 * Generate the access token.
 *
 * POST /oauth/access_token
 */
export async function getOAuthAccessToken(
  consumerKey: string,
  consumerSecret: string,
  requestToken: string,
  verifier: string
): Promise<DiscogsOAuthAccessToken> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = Math.random().toString(36).substring(2)

  // Discogs docs specify PLAINTEXT signature as consumerSecret& for access tokens.
  const signature = `${consumerSecret}&`

  const authHeader =
    `OAuth oauth_consumer_key="${consumerKey}", ` +
    `oauth_nonce="${nonce}", ` +
    `oauth_token="${requestToken}", ` +
    `oauth_signature="${signature}", ` +
    `oauth_signature_method="PLAINTEXT", ` +
    `oauth_timestamp="${timestamp}", ` +
    `oauth_verifier="${verifier}"`

  const response = await apiClient.post<string>('/oauth/access_token', null, {
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    responseType: 'text'
  })

  const params = new URLSearchParams(response.data)
  return {
    oauth_token: params.get('oauth_token') ?? '',
    oauth_token_secret: params.get('oauth_token_secret') ?? ''
  }
}

/**
 * Identity
 * Retrieve basic information about the authenticated user.
 * You can use this resource to find out who you’re authenticated as, and it also doubles
 * as a good sanity check to ensure that you’re using OAuth correctly.
 *
 * GET /oauth/identity
 */
export async function getIdentity(): Promise<DiscogsIdentity> {
  const response = await apiClient.get<DiscogsIdentity>('/oauth/identity')
  return response.data
}

/**
 * ==============================================================================
 * User Identity
 * ==============================================================================
 */

/**
 * Profile
 * Retrieve a user by username.
 * If authenticated as the requested user, the email key will be visible, and the num_list count will include the user’s private lists.
 * If authenticated as the requested user or the user’s collection/wantlist is public, the num_collection / num_wantlist keys will be visible.
 *
 * GET /users/{username}
 */
export async function getUserProfile(
  username: string
): Promise<DiscogsUserProfile> {
  const response = await apiClient.get<DiscogsUserProfile>(`/users/${username}`)
  return response.data
}

/**
 * Edit User Profile
 * Edit a user’s profile data.
 * Authentication as the user is required.
 *
 * POST /users/{username}
 */
export async function updateUserProfile(
  username: string,
  data: DiscogsUserProfileUpdate
): Promise<DiscogsUserProfile> {
  const response = await apiClient.post<DiscogsUserProfile>(
    `/users/${username}`,
    data
  )
  return response.data
}

/**
 * Helper: Validate Credentials
 * Validate credentials by attempting to get identity.
 * Returns the identity if valid, throws if invalid.
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
 * ==============================================================================
 * User Collection
 * ==============================================================================
 * The Collection resource allows you to view and manage a user’s collection.
 * A collection is arranged into folders. Every user has two permanent folders already:
 *
 * ID 0, the “All” folder, which cannot have releases added to it, and
 * ID 1, the “Uncategorized” folder.
 *
 * Because it’s possible to own more than one copy of a release, each with its own notes,
 * grading, and so on, each instance of a release in a folder has an instance ID.
 *
 * Through the Discogs website, users can create custom notes fields. There is not yet
 * an API method for creating and deleting these fields, but they can be listed, and
 * the values of the fields on any instance can be modified.
 */

/**
 * Collection
 * Retrieve a list of folders in a user’s collection.
 * If the collection has been made private by its owner, authentication as the collection owner is required.
 * If you are not authenticated as the collection owner, only folder ID 0 (the “All” folder) will be visible (if the requested user’s collection is public).
 *
 * GET /users/{username}/collection/folders
 */
export async function getCollectionFolders(
  username: string
): Promise<DiscogsCollectionFoldersResponse> {
  const response = await apiClient.get<DiscogsCollectionFoldersResponse>(
    `/users/${username}/collection/folders`
  )
  return response.data
}

/**
 * Collection Folder
 * Retrieve metadata about a folder in a user’s collection.
 * If folder_id is not 0, authentication as the collection owner is required.
 *
 * GET /users/{username}/collection/folders/{folder_id}
 */
export async function getCollectionFolder(
  username: string,
  folderId: number
): Promise<DiscogsCollectionFolder> {
  const response = await apiClient.get<DiscogsCollectionFolder>(
    `/users/${username}/collection/folders/${folderId}`
  )
  return response.data
}

/**
 * Collection Items By Release
 * View the user’s collection folders which contain a specified release. This will also show information about each release instance.
 * The release_id must be non-zero.
 * Authentication as the collection owner is required if the owner’s collection is private.
 *
 * GET /users/{username}/collection/releases/{release_id}
 */
export async function getCollectionItemsByRelease(
  username: string,
  releaseId: number
): Promise<DiscogsCollectionResponse> {
  const response = await apiClient.get<DiscogsCollectionResponse>(
    `/users/${username}/collection/releases/${releaseId}`
  )
  return response.data
}

/**
 * List Custom Fields
 * Retrieve a list of user-defined collection notes fields. These fields are available on every release in the collection.
 * If the collection has been made private by its owner, authentication as the collection owner is required.
 * If you are not authenticated as the collection owner, only fields with public set to true will be visible.
 *
 * GET /users/{username}/collection/fields
 */
export async function getCustomFields(
  username: string
): Promise<DiscogsCollectionFieldsResponse> {
  const response = await apiClient.get<DiscogsCollectionFieldsResponse>(
    `/users/${username}/collection/fields`
  )
  return response.data
}

/**
 * Collection Items By Folder
 * Returns the list of item in a folder in a user’s collection. Accepts Pagination parameters.
 * Basic information about each release is provided, suitable for display in a list. For detailed information, make another API call to fetch the corresponding release.
 * If folder_id is not 0, or the collection has been made private by its owner, authentication as the collection owner is required.
 * If you are not authenticated as the collection owner, only public notes fields will be visible.
 * Defaults to folder_id 0 (All) when not provided.
 *
 * GET /users/{username}/collection/folders/{folder_id}/releases
 */
export async function getCollection(
  username: string,
  params: CollectionParams = {}
): Promise<DiscogsCollectionResponse> {
  const {
    page = 1,
    perPage = COLLECTION.PER_PAGE,
    folderId = 0,
    sort,
    sortOrder
  } = params

  const response = await apiClient.get<DiscogsCollectionResponse>(
    `/users/${username}/collection/folders/${folderId}/releases`,
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
 * Collection Value
 * Get the minimum, median, and maximum value of a user's collection.
 * Authentication as the collection owner is required.
 *
 * GET /users/{username}/collection/value
 */
export async function getCollectionValue(
  username: string
): Promise<DiscogsCollectionValue> {
  const response = await apiClient.get<DiscogsCollectionValue>(
    `/users/${username}/collection/value`
  )

  return response.data
}

/**
 * Check if a release is a vinyl record
 */
export function isVinylRecord(formats: { name: string }[]): boolean {
  return formats.some((format) => format.name === 'Vinyl')
}

/**
 * ==============================================================================
 * User Wantlist
 * ==============================================================================
 * The Wantlist resource allows you to view and manage a user’s wantlist.
 */

/**
 * Wantlist
 * Returns the list of releases in a user’s wantlist. Accepts Pagination parameters.
 * Basic information about each release is provided, suitable for display in a list. For detailed information, make another API call to fetch the corresponding release.
 * If the wantlist has been made private by its owner, you must be authenticated as the owner to view it.
 * The notes field will be visible if you are authenticated as the wantlist owner.
 *
 * GET /users/{username}/wants
 */
export async function getWantlist(
  username: string,
  params: { page?: number; perPage?: number } = {}
): Promise<DiscogsWantlistResponse> {
  const { page = 1, perPage = 50 } = params

  const response = await apiClient.get<DiscogsWantlistResponse>(
    `/users/${username}/wants`,
    {
      params: {
        page,
        per_page: perPage
      }
    }
  )

  return response.data
}

/**
 * Add To Wantlist
 * Add a release to a user’s wantlist.
 * Authentication as the wantlist owner is required.
 *
 * PUT /users/{username}/wants/{release_id}
 */
export async function addToWantlist(
  username: string,
  releaseId: number,
  data: DiscogsWantlistAddRequest = {}
): Promise<DiscogsWantlistAddResponse> {
  const response = await apiClient.put<DiscogsWantlistAddResponse>(
    `/users/${username}/wants/${releaseId}`,
    data
  )
  return response.data
}

/**
 * Edit Wantlist
 * Edit the notes or rating on a wantlist item.
 * Authentication as the wantlist owner is required.
 *
 * POST /users/{username}/wants/{release_id}
 */
export async function editWantlist(
  username: string,
  releaseId: number,
  data: DiscogsWantlistAddRequest
): Promise<DiscogsWantlistAddResponse> {
  const response = await apiClient.post<DiscogsWantlistAddResponse>(
    `/users/${username}/wants/${releaseId}`,
    data
  )
  return response.data
}

/**
 * Delete From Wantlist
 * Remove a release from a user’s wantlist.
 * Authentication as the wantlist owner is required.
 *
 * DELETE /users/{username}/wants/{release_id}
 */
export async function removeFromWantlist(
  username: string,
  releaseId: number
): Promise<void> {
  await apiClient.delete(`/users/${username}/wants/${releaseId}`)
}

/**
 * ==============================================================================
 * Database
 * ==============================================================================
 */

/**
 * Release
 * The Release resource represents a particular physical or digital object released by one or more Artists.
 *
 * GET /releases/{release_id}
 * Get a release
 */
export async function getRelease(
  releaseId: number,
  currencyCode?: string
): Promise<DiscogsRelease> {
  const response = await apiClient.get<DiscogsRelease>(
    `/releases/${releaseId}`,
    {
      params: currencyCode ? { curr_abbr: currencyCode } : undefined
    }
  )

  return response.data
}

/**
 * Master Release
 * The Master resource represents a set of similar Releases. Masters (also known as “master releases”)
 * have a “main release” which is often the chronologically earliest.
 *
 * GET /masters/{master_id}
 * Get a master release
 */
export async function getMasterRelease(
  masterId: number
): Promise<DiscogsMasterRelease> {
  const response = await apiClient.get<DiscogsMasterRelease>(
    `/masters/${masterId}`
  )

  return response.data
}

/**
 * Release Rating By User
 * Retrieves the release’s rating for a given user.
 *
 * GET /releases/{release_id}/rating/{username}
 */
export async function getReleaseRatingByUser(
  releaseId: number,
  username: string
): Promise<DiscogsReleaseRatingByUser> {
  const response = await apiClient.get<DiscogsReleaseRatingByUser>(
    `/releases/${releaseId}/rating/${username}`
  )
  return response.data
}

/**
 * Community Release Rating
 * Retrieves the community release rating average and count.
 *
 * GET /releases/{release_id}/rating
 */
export async function getCommunityReleaseRating(
  releaseId: number
): Promise<DiscogsCommunityReleaseRating> {
  const response = await apiClient.get<DiscogsCommunityReleaseRating>(
    `/releases/${releaseId}/rating`
  )
  return response.data
}

/**
 * Release Stats
 * The Release Stats endpoint retrieves the total number of “haves” (in the community’s collections)
 * and “wants” (in the community’s wantlists) for a given release.
 *
 * GET /releases/{release_id}/stats
 * Retrieves the release’s “have” and “want” counts.
 */
export async function getReleaseStats(
  releaseId: number
): Promise<DiscogsReleaseStats> {
  const response = await apiClient.get<DiscogsReleaseStats>(
    `/releases/${releaseId}/stats`
  )
  return response.data
}

/**
 * Master Release Versions
 * Retrieves a list of all Releases that are versions of this master. Accepts Pagination parameters.
 *
 * GET /masters/{master_id}/versions{?page,per_page}
 */
export async function getMasterReleaseVersions(
  masterId: number,
  params: {
    page?: number
    per_page?: number
    format?: string
    label?: string
    released?: string
    country?: string
    sort?: 'released' | 'title' | 'format' | 'label' | 'catno' | 'country'
    sort_order?: 'asc' | 'desc'
  } = {}
): Promise<DiscogsMasterVersionsResponse> {
  const response = await apiClient.get<DiscogsMasterVersionsResponse>(
    `/masters/${masterId}/versions`,
    { params }
  )
  return response.data
}

/**
 * Search
 * Issue a search query to our database. This endpoint accepts pagination parameters.
 * Authentication (as any user) is required.
 *
 * GET /database/search?q={query}&{?type,title,release_title,credit,artist,anv,label,genre,style,country,year,format,catno,barcode,track,submitter,contributor}
 * Issue a search query
 */
export async function searchDatabase(
  params: SearchParams
): Promise<DiscogsSearchResponse> {
  const response = await apiClient.get<DiscogsSearchResponse>(
    '/database/search',
    { params }
  )
  return response.data
}

/**
 * ==============================================================================
 * Marketplace
 * ==============================================================================
 */

/**
 * Fee
 * The Fee resource allows you to quickly calculate the fee for selling an item on the Marketplace.
 *
 * GET /marketplace/fee/{price}
 * GET /marketplace/fee/{price}/{currency}
 */
export async function getMarketplaceFee(
  price: number,
  currency: string = 'USD'
): Promise<DiscogsMarketplaceFee> {
  const response = await apiClient.get<DiscogsMarketplaceFee>(
    `/marketplace/fee/${price.toFixed(2)}/${currency}`
  )
  return response.data
}

/**
 * Price Suggestions
 * Retrieve price suggestions for the provided Release ID. If no suggestions are available, an empty object will be returned.
 * Authentication is required, and the user needs to have filled out their seller settings. Suggested prices will be denominated in the user’s selling currency.
 *
 * @remarks
 * **Important:** To receive condition-based valuations (VG, VG+, etc.), the authenticated user **MUST** have their Discogs Seller Settings configured.
 * Without this, the API may return empty data or limited results.
 *
 * GET /marketplace/price_suggestions/{release_id}
 */
export async function getPriceSuggestions(
  releaseId: number
): Promise<DiscogsPriceSuggestionsResponse> {
  const response = await apiClient.get<DiscogsPriceSuggestionsResponse>(
    `/marketplace/price_suggestions/${releaseId}`
  )
  return response.data
}

/**
 * Release Statistics (Marketplace)
 * Retrieve marketplace statistics for the provided Release ID. These statistics reflect the state of the release in the marketplace currently, and include the number of items currently for sale, lowest listed price of any item for sale, and whether the item is blocked for sale in the marketplace.
 *
 * GET /marketplace/stats/{release_id}{?curr_abbr}
 */
export async function getMarketplaceStats(
  releaseId: number,
  currencyCode?: string
): Promise<DiscogsMarketplaceStats> {
  const response = await apiClient.get<DiscogsMarketplaceStats>(
    `/marketplace/stats/${releaseId}`,
    {
      params: currencyCode ? { curr_abbr: currencyCode } : undefined
    }
  )
  return response.data
}

/**
 * ==============================================================================
 * Developer Notes & Common Pitfalls (Reference)
 * ==============================================================================
 *
 * Condition-based Pricing (Price Suggestions):
 * - To receive condition-based valuations (VG, VG+, NM, Mint), the authenticated user
 *   MUST have their Discogs Seller Settings configured.
 * - Without this, Discogs API may return empty data or only floor prices.
 * - Required settings: Full name, shipping address, PayPal, currency, seller terms, policy agreement.
 * - Note: Actual selling/verification isn't required, just the settings.
 *
 * Marketplace Data & Rate Limits:
 * - Fetching full marketplace data is expensive. A complete picture often requires 3 calls per item:
 *   1. Marketplace Stats (lowest price, quantity)
 *   2. Price Suggestions (requires seller settings)
 *   3. Release/Community Data
 * - With a 60 req/min limit, processing a large collection takes time (e.g., ~16 items/min).
 * - Caching is highly recommended.
 *
 * Master vs. Release Counts:
 * - "Master Data" counts unique master releases (canonical versions).
 * - "Marketplace Data" usually counts specific releases (pressings).
 * - Counts will differ if a user owns multiple pressings of the same master, or if releases
 *   lack a master ID (singles, bootlegs).
 */
