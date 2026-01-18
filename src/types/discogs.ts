/**
 * ==============================================================================
 * Authentication
 * ==============================================================================
 */

export type DiscogsCurrency =
  | 'USD'
  | 'GBP'
  | 'EUR'
  | 'CAD'
  | 'AUD'
  | 'JPY'
  | 'CHF'
  | 'MXN'
  | 'BRL'
  | 'NZD'
  | 'SEK'
  | 'ZAR'

/**
 * Response from GET /oauth/request_token
 */
export interface DiscogsOAuthRequestToken {
  oauth_token: string
  oauth_token_secret: string
  oauth_callback_confirmed: string
}

/**
 * Response from POST /oauth/access_token
 */
export interface DiscogsOAuthAccessToken {
  oauth_token: string
  oauth_token_secret: string
}

/**
 * ==============================================================================
 * User Identity
 * ==============================================================================
 */

/**
 * Request body for POST /users/{username}
 */
export interface DiscogsUserProfileUpdate {
  /** The real name of the user */
  name?: string
  /** The user’s website */
  home_page?: string
  /** The geographical location of the user */
  location?: string
  /** Biographical information about the user */
  profile?: string
  /** Currency for marketplace data. Must be one of: USD GBP EUR CAD AUD JPY CHF MXN BRL NZD SEK ZAR */
  curr_abbr?: DiscogsCurrency
}

/**
 * Response from GET /oauth/identity
 * Returns basic information about the authenticated user.
 * Note: Does NOT include email - use getUserProfile() for that.
 */
export interface DiscogsIdentity {
  id: number
  username: string
  resource_url: string
  consumer_name?: string
  avatar_url?: string
}

/**
 * Response from GET /users/{username}
 * Retrieves a user profile by username.
 * Note: email field is ONLY visible if authenticated as the requested user.
 * Note: num_collection/num_wantlist are only visible if authenticated as the user or if collection/wantlist is public.
 */
export interface DiscogsUserProfile {
  id: number
  username: string
  resource_url: string
  uri?: string
  profile?: string
  name?: string
  home_page?: string
  location?: string
  registered?: string
  rank?: number
  num_pending?: number
  num_for_sale?: number
  num_collection?: number
  num_wantlist?: number
  num_lists?: number
  releases_contributed?: number
  releases_rated?: number
  rating_avg?: number
  buyer_rating?: number
  buyer_rating_stars?: number
  buyer_num_ratings?: number
  seller_rating?: number
  seller_rating_stars?: number
  seller_num_ratings?: number
  curr_abbr?: DiscogsCurrency
  avatar_url?: string
  banner_url?: string
  wantlist_url?: string
  inventory_url?: string
  collection_folders_url?: string
  collection_fields_url?: string
  /** Only visible if authenticated as the requested user */
  email?: string
}

/**
 * ==============================================================================
 * User Collection
 * ==============================================================================
 */

/**
 * Metadata about a user-defined collection notes field.
 */
export interface DiscogsCollectionField {
  id: number
  name: string
  position: number
  type: 'dropdown' | 'textarea' | 'text'
  public: boolean
  options?: string[]
  lines?: number
}

/**
 * Response from GET /users/{username}/collection/fields
 */
export interface DiscogsCollectionFieldsResponse {
  fields: DiscogsCollectionField[]
}

/**
 * Metadata about a folder in a user's collection.
 */
export interface DiscogsCollectionFolder {
  id: number
  count: number
  name: string
  resource_url: string
}

/**
 * Response from GET /users/{username}/collection/folders
 */
export interface DiscogsCollectionFoldersResponse {
  folders: DiscogsCollectionFolder[]
}

/**
 * A single item in a user's collection.
 * Part of the response from GET /users/{username}/collection/folders/{folder_id}/releases
 */
export interface DiscogsCollectionRelease {
  /** Release ID */
  id: number
  /** Unique instance ID for this item in the collection */
  instance_id: number
  /** ISO 8601 date when added to collection */
  date_added: string
  /** User's rating (0-5) */
  rating: number
  /** Basic release information */
  basic_information: DiscogsBasicInformation
  /** Folder ID this release is in */
  folder_id?: number
  /**
   * Custom notes fields.
   * Note: If not authenticated as collection owner, only public notes are visible.
   */
  notes?: Array<{
    field_id: number
    value: string
  }>
}

/**
 * ==============================================================================
 * Pagination
 * ==============================================================================
 * Some resources represent collections of objects and may be paginated.
 * By default, 50 items per page are shown.
 *
 * To browse different pages, or change the number of items per page (up to 100),
 * use the page and per_page query string parameters.
 *
 * Responses include a Link header and a pagination object in the response body.
 */
export interface DiscogsPagination {
  page: number
  pages: number
  per_page: number
  items: number
  urls: {
    first?: string
    prev?: string
    next?: string
    last?: string
  }
}

/**
 * Response from GET /users/{username}/collection/folders/{folder_id}/releases
 * Returns paginated list of items in a user's collection folder.
 *
 * Authentication requirements:
 * - If folder_id is not 0, or collection is private: auth as owner required
 * - If not authenticated as owner: only public notes fields are visible
 */
export interface DiscogsCollectionResponse {
  pagination: DiscogsPagination
  releases: DiscogsCollectionRelease[]
}

/** Client-side sort keys (may differ from API sort keys) */
export type CollectionSortKey =
  | 'artist'
  | 'title'
  | 'added'
  | 'genre'
  | 'releaseYear'
  | 'label'
  | 'format'
  | 'random'

/**
 * Valid sort keys for GET /users/{username}/collection/folders/{folder_id}/releases
 * API accepts: label, artist, title, catno, format, rating, added, year
 */
export type DiscogsCollectionSortKey =
  | 'artist'
  | 'title'
  | 'added'
  | 'year'
  | 'label'
  | 'format'
  | 'catno'
  | 'rating'

/** Sort order for collection items */
export type CollectionSortOrder = 'asc' | 'desc'

/**
 * Parameters for fetching collection items
 * Used with GET /users/{username}/collection/folders/{folder_id}/releases
 */
export interface CollectionParams {
  page?: number
  perPage?: number
  folderId?: number
  sort?: DiscogsCollectionSortKey
  sortOrder?: CollectionSortOrder
}

/**
 * Response from GET /users/{username}/collection/value
 * Returns the minimum, median, and maximum value of a user's collection.
 * Authentication as the collection owner is required.
 */
export interface DiscogsCollectionValue {
  minimum: string
  median: string
  maximum: string
}

/**
 * ==============================================================================
 * User Wantlist
 * ==============================================================================
 * The Wantlist resource allows you to view and manage a user’s wantlist.
 */

/**
 * Request body for PUT /users/{username}/wants/{release_id}
 */
export interface DiscogsWantlistAddRequest {
  /** User notes to associate with this release */
  notes?: string
  /** User’s rating of this release, from 0 (unrated) to 5 (best). Defaults to 0. */
  rating?: number
}

/**
 * Response from PUT /users/{username}/wants/{release_id}
 */
export interface DiscogsWantlistAddResponse {
  id: number
  resource_url: string
  rating: number
  notes?: string
  basic_information: DiscogsBasicInformation
}

/**
 * A single item in a user's wantlist.
 * Part of the response from GET /users/{username}/wants
 */
export interface DiscogsWantlistItem {
  /** Release ID */
  id: number
  resource_url: string
  /** User's rating (0-5) */
  rating: number
  /** Basic release information */
  basic_information: DiscogsBasicInformation
  /**
   * User notes for this want.
   * Only visible if authenticated as the wantlist owner.
   */
  notes?: string
}

/**
 * Response from GET /users/{username}/wants
 * Returns paginated list of items in a user's wantlist.
 *
 * Authentication requirements:
 * - If wantlist is private: auth as owner required
 * - notes field: Only visible if authenticated as owner
 */
export interface DiscogsWantlistResponse {
  pagination: DiscogsPagination
  wants: DiscogsWantlistItem[]
}

/**
 * ==============================================================================
 * Database
 * ==============================================================================
 */

export interface DiscogsArtist {
  id: number
  name: string
  resource_url?: string
  /** Artist name variation */
  anv?: string
  /** String to join multiple artists */
  join?: string
  /** Artist role on the release */
  role?: string
  /** Tracks the artist appears on */
  tracks?: string
}

export interface DiscogsLabel {
  id?: number
  name: string
  /** Catalog number */
  catno: string
  resource_url?: string
  entity_type?: string
  entity_type_name?: string
}

export interface DiscogsFormat {
  name: string
  /** Quantity */
  qty: string
  text?: string
  /** Format descriptions (e.g., "Mini", "EP", "Album") */
  descriptions?: string[]
}

/**
 * Basic information about a release.
 * Suitable for display in a list. For detailed information,
 * make another API call to fetch the corresponding release.
 */
export interface DiscogsBasicInformation {
  id: number
  title: string
  year: number
  resource_url: string
  /** Thumbnail image URL (150x150) */
  thumb: string
  /** Cover image URL (500x500) */
  cover_image: string
  formats: DiscogsFormat[]
  labels: DiscogsLabel[]
  artists: DiscogsArtist[]
  country?: string
  genres: string[]
  styles: string[]
  master_id?: number
  master_url?: string
}

/**
 * Community statistics for a release
 */
export interface DiscogsCommunity {
  contributors: Array<{
    resource_url: string
    username: string
  }>
  data_quality: string
  /** Number of users who have this release */
  have: number
  rating: {
    average: number
    count: number
  }
  status: string
  submitter: {
    resource_url: string
    username: string
  }
  /** Number of users who want this release */
  want: number
}

/**
 * Company/label involved in a release
 */
export interface DiscogsCompany {
  catno: string
  entity_type: string
  entity_type_name: string
  id: number
  name: string
  resource_url: string
}

/**
 * Identifier (barcode, matrix, etc.) for a release
 */
export interface DiscogsIdentifier {
  type: string
  value: string
  description?: string
}

/**
 * Image for a release
 */
export interface DiscogsImage {
  height: number
  width: number
  resource_url: string
  type: 'primary' | 'secondary'
  uri: string
  uri150: string
}

/**
 * Track in a release
 */
export interface DiscogsTrack {
  position: string
  title: string
  type_: string
  duration?: string
  extraartists?: DiscogsArtist[]
}

/**
 * Video for a release
 */
export interface DiscogsVideo {
  uri: string
  title: string
  description: string
  duration: number
  embed: boolean
}

/**
 * Response from GET /releases/{release_id}
 * Detailed information about a specific release.
 */
export interface DiscogsRelease {
  id: number
  title: string
  artists: DiscogsArtist[]
  data_quality: string
  thumb: string
  community: DiscogsCommunity
  companies?: DiscogsCompany[]
  country?: string
  date_added: string
  date_changed: string
  estimated_weight?: number
  extraartists?: DiscogsArtist[]
  format_quantity: number
  formats: DiscogsFormat[]
  genres: string[]
  identifiers?: DiscogsIdentifier[]
  images?: DiscogsImage[]
  labels: DiscogsLabel[]
  /** Lowest price for sale in marketplace (in user's currency) */
  lowest_price?: number
  /** Number currently for sale in marketplace */
  num_for_sale?: number
  master_id?: number
  master_url?: string
  notes?: string
  /** Release year (e.g., "1987") */
  released?: string
  released_formatted?: string
  resource_url: string
  series?: unknown[]
  status: string
  styles?: string[]
  tracklist: DiscogsTrack[]
  uri: string
  videos?: DiscogsVideo[]
  year: number
}

/**
 * Response from GET /masters/{master_id}
 * A master release represents a set of similar releases.
 */
export interface DiscogsMasterRelease {
  id: number
  title: string
  /** Main/primary release ID */
  main_release: number
  main_release_url: string
  uri: string
  resource_url: string
  versions_url: string
  artists: DiscogsArtist[]
  genres: string[]
  styles?: string[]
  year: number
  tracklist: DiscogsTrack[]
  images?: DiscogsImage[]
  videos?: DiscogsVideo[]
  data_quality: string
  /** Lowest price for sale in marketplace */
  lowest_price?: number
  /** Number currently for sale in marketplace */
  num_for_sale?: number
}

/**
 * Response from GET /releases/{release_id}/rating/{username}
 */
export interface DiscogsReleaseRatingByUser {
  username: string
  release_id: number
  rating: number
}

/**
 * Response from GET /releases/{release_id}/rating
 */
export interface DiscogsCommunityReleaseRating {
  rating: {
    count: number
    average: number
  }
  release_id: number
}

/**
 * Response from GET /releases/{release_id}/stats
 */
export interface DiscogsReleaseStats {
  num_have: number
  num_want: number
}

/**
 * A single version of a master release.
 */
export interface DiscogsMasterVersion {
  id: number
  status: string
  stats: {
    user: {
      in_collection: number
      in_wantlist: number
    }
    community: {
      in_collection: number
      in_wantlist: number
    }
  }
  thumb: string
  format: string
  country: string
  title: string
  label: string
  released: string
  major_formats: string[]
  catno: string
  resource_url: string
}

/**
 * Parameters for GET /masters/{master_id}/versions
 */
export interface MasterReleaseVersionsParams {
  page?: number
  per_page?: number
  format?: string
  label?: string
  released?: string
  country?: string
  sort?: 'released' | 'title' | 'format' | 'label' | 'catno' | 'country'
  sort_order?: 'asc' | 'desc'
}

/**
 * Response from GET /masters/{master_id}/versions
 */
export interface DiscogsMasterVersionsResponse {
  pagination: DiscogsPagination
  versions: DiscogsMasterVersion[]
}

/**
 * A single result from a database search.
 */
export interface DiscogsSearchResult {
  id: number
  type: 'release' | 'master' | 'artist' | 'label'
  title: string
  uri: string
  resource_url: string
  thumb: string
  cover_image?: string
  genre?: string[]
  style?: string[]
  format?: string[]
  country?: string
  year?: string
  label?: string[]
  catno?: string
  barcode?: string[]
  community?: {
    want: number
    have: number
  }
}

/**
 * Response from GET /database/search
 */
export interface DiscogsSearchResponse {
  pagination: DiscogsPagination
  results: DiscogsSearchResult[]
}

/**
 * Parameters for GET /database/search
 */
export interface SearchParams {
  q?: string
  type?: 'release' | 'master' | 'artist' | 'label'
  title?: string
  release_title?: string
  credit?: string
  artist?: string
  anv?: string
  label?: string
  genre?: string
  style?: string
  country?: string
  year?: string
  format?: string
  catno?: string
  barcode?: string
  track?: string
  submitter?: string
  contributor?: string
  page?: number
  per_page?: number
}

/**
 * ==============================================================================
 * Marketplace
 * ==============================================================================
 */

/**
 * Response from GET /marketplace/fee/{price}
 */
export interface DiscogsMarketplaceFee {
  value: number
  currency: string
}

/**
 * Price suggestion for a specific grade
 */
export interface DiscogsPriceSuggestion {
  currency: string
  value: number
}

/**
 * Response from GET /marketplace/price_suggestions/{release_id}
 */
export type DiscogsPriceSuggestionsResponse = Record<
  string,
  DiscogsPriceSuggestion
>

/**
 * Response from GET /marketplace/stats/{release_id}
 */
export interface DiscogsMarketplaceStats {
  lowest_price: {
    currency: string
    value: number
  } | null
  num_for_sale: number | null
  blocked_from_sale: boolean
}
