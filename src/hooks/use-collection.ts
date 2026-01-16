import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCollection, isVinylRecord } from '@/api/discogs'
import { useAuth } from '@/hooks/use-auth'
import type {
  CollectionSortKey,
  CollectionSortOrder,
  DiscogsCollectionSortKey,
  DiscogsCollectionRelease
} from '@/types/discogs'

interface UseCollectionOptions {
  page?: number
  sort?: CollectionSortKey
  sortOrder?: CollectionSortOrder
}

interface UseCollectionReturn {
  releases: DiscogsCollectionRelease[]
  vinylOnly: DiscogsCollectionRelease[]
  filteredReleases: DiscogsCollectionRelease[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  pagination: {
    page: number
    pages: number
    total: number
    perPage: number
  } | null
  search: string
  setSearch: (search: string) => void
  sort: CollectionSortKey
  setSort: (sort: CollectionSortKey) => void
  sortOrder: CollectionSortOrder
  setSortOrder: (order: CollectionSortOrder) => void
}

export function useCollection(
  options: UseCollectionOptions = {}
): UseCollectionReturn {
  const { username } = useAuth()
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CollectionSortKey>(options.sort ?? 'added')
  const [sortOrder, setSortOrder] = useState<CollectionSortOrder>(
    options.sortOrder ?? 'desc'
  )
  const [randomSeed, setRandomSeed] = useState(() => Date.now())
  const lastSortRef = useRef<CollectionSortKey>(sort)
  const isClientSort = sort === 'genre' || sort === 'random'

  const lastSortOrderRef = useRef<CollectionSortOrder>(sortOrder)

  useEffect(() => {
    const sortChanged = lastSortRef.current !== sort
    const orderChanged = lastSortOrderRef.current !== sortOrder

    if (sort === 'random' && (sortChanged || orderChanged)) {
      setRandomSeed((seed) => seed + 1)
    }

    lastSortRef.current = sort
    lastSortOrderRef.current = sortOrder
  }, [sort, sortOrder])

  const serverSort: DiscogsCollectionSortKey = isClientSort
    ? 'added'
    : (() => {
        switch (sort) {
          case 'releaseYear':
            return 'year'
          case 'label':
            return 'label'
          case 'format':
            return 'format'
          case 'artist':
          case 'title':
          case 'added':
            return sort
          default:
            return 'added'
        }
      })()

  const serverSortOrder: CollectionSortOrder = isClientSort
    ? 'desc'
    : sortOrder

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'collection',
      username,
      options.page ?? 1,
      serverSort,
      serverSortOrder
    ],
    queryFn: () =>
      getCollection(username!, {
        page: options.page ?? 1,
        sort: serverSort,
        sortOrder: serverSortOrder
      }),
    enabled: !!username,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  const releases = data?.releases

  // Filter to vinyl only
  const vinylOnly = useMemo(() => {
    if (!releases) return []
    return releases.filter((release) =>
      isVinylRecord(release.basic_information.formats)
    )
  }, [releases])

  // Apply search filter
  const filteredReleases = useMemo(() => {
    if (!search.trim()) return vinylOnly

    const searchLower = search.toLowerCase()
    return vinylOnly.filter((release) => {
      const info = release.basic_information
      const artistMatch = info.artists.some((artist) =>
        artist.name.toLowerCase().includes(searchLower)
      )
      const titleMatch = info.title.toLowerCase().includes(searchLower)
      return artistMatch || titleMatch
    })
  }, [vinylOnly, search])

  const sortedReleases = useMemo(() => {
    if (sort === 'genre') {
      const order = sortOrder === 'asc' ? 1 : -1
      return [...filteredReleases].sort((a, b) => {
        const aGenre = a.basic_information.genres?.[0] ?? ''
        const bGenre = b.basic_information.genres?.[0] ?? ''
        const primaryCompare = aGenre.localeCompare(bGenre, undefined, {
          sensitivity: 'base'
        })
        if (primaryCompare !== 0) return primaryCompare * order
        return (
          a.basic_information.title.localeCompare(
            b.basic_information.title,
            undefined,
            { sensitivity: 'base' }
          ) * order
        )
      })
    }

    if (sort === 'random') {
      const random = (seed: number) => () => {
        let t = (seed += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }
      const next = random(randomSeed)
      const copy = [...filteredReleases]
      for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(next() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    }

    return filteredReleases
  }, [filteredReleases, sort, sortOrder, randomSeed])

  const pagination = data?.pagination
    ? {
        page: data.pagination.page,
        pages: data.pagination.pages,
        total: data.pagination.items,
        perPage: data.pagination.per_page
      }
    : null

  return {
    releases: releases ?? [],
    vinylOnly,
    filteredReleases: sortedReleases,
    isLoading,
    isError,
    error: error as Error | null,
    pagination,
    search,
    setSearch,
    sort,
    setSort,
    sortOrder,
    setSortOrder
  }
}
