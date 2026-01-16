export interface DiscogsIdentity {
  id: number
  username: string
  resource_url: string
  consumer_name?: string
}

export interface DiscogsArtist {
  id: number
  name: string
  resource_url?: string
  anv?: string
  join?: string
  role?: string
  tracks?: string
}

export interface DiscogsLabel {
  id?: number
  name: string
  catno: string
  resource_url?: string
  entity_type?: string
  entity_type_name?: string
}

export interface DiscogsFormat {
  name: string
  qty: string
  text?: string
  descriptions?: string[]
}

export interface DiscogsBasicInformation {
  id: number
  title: string
  year: number
  resource_url: string
  thumb: string
  cover_image: string
  formats: DiscogsFormat[]
  labels: DiscogsLabel[]
  artists: DiscogsArtist[]
  genres: string[]
  styles: string[]
  master_id?: number
  master_url?: string
}

export interface DiscogsCollectionRelease {
  id: number
  instance_id: number
  date_added: string
  rating: number
  basic_information: DiscogsBasicInformation
  folder_id?: number
  notes?: Array<{
    field_id: number
    value: string
  }>
}

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

export interface DiscogsCollectionResponse {
  pagination: DiscogsPagination
  releases: DiscogsCollectionRelease[]
}

export type CollectionSortKey =
  | 'artist'
  | 'title'
  | 'added'
  | 'genre'
  | 'releaseYear'
  | 'label'
  | 'format'
  | 'random'

export type DiscogsCollectionSortKey =
  | 'artist'
  | 'title'
  | 'added'
  | 'year'
  | 'label'
  | 'format'
export type CollectionSortOrder = 'asc' | 'desc'

export interface CollectionParams {
  page?: number
  perPage?: number
  sort?: DiscogsCollectionSortKey
  sortOrder?: CollectionSortOrder
}
