import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { getCollection, isVinylRecord } from '@/api/discogs'
import { useAuth } from '@/hooks/use-auth'
import { COLLECTION } from '@/lib/constants'
import {
  readParamList,
  readParamRange,
  readSearchParams,
  updateSearchParams
} from '@/lib/url-state'
import type {
  CollectionSortKey,
  CollectionSortOrder,
  DiscogsCollectionSortKey,
  DiscogsCollectionRelease
} from '@/types/discogs'

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base'
})

const sortValues = (values: Set<string>) =>
  Array.from(values).sort((a, b) => collator.compare(a, b))

const sortSizes = (values: string[]) =>
  values.sort((a, b) => {
    const aNumber = Number.parseFloat(a)
    const bNumber = Number.parseFloat(b)
    if (
      !Number.isNaN(aNumber) &&
      !Number.isNaN(bNumber) &&
      aNumber !== bNumber
    ) {
      return aNumber - bNumber
    }
    return collator.compare(a, b)
  })

const isSizeDescriptor = (value: string) =>
  value.includes('"') || /inch/i.test(value)

const extractVinylDescriptors = (
  formats: { name: string; descriptions?: string[] }[]
) => {
  const types: string[] = []
  const sizes: string[] = []

  for (const format of formats) {
    if (format.name !== 'Vinyl') continue
    for (const description of format.descriptions ?? []) {
      if (isSizeDescriptor(description)) {
        sizes.push(description)
      } else {
        types.push(description)
      }
    }
  }

  return { types, sizes }
}

const FILTER_PARAM_KEYS = {
  genres: 'genre',
  styles: 'style',
  labels: 'label',
  types: 'type',
  sizes: 'size',
  countries: 'country',
  yearRange: 'year'
} as const

interface UseCollectionOptions {
  page?: number
  sort?: CollectionSortKey
  sortOrder?: CollectionSortOrder
}

interface CollectionFilterOptions {
  genres: string[]
  styles: string[]
  labels: string[]
  types: string[]
  sizes: string[]
  countries: string[]
  yearBounds: [number, number] | null
}

interface CollectionSelectedFilters {
  genres: string[]
  styles: string[]
  labels: string[]
  types: string[]
  sizes: string[]
  countries: string[]
  yearRange: [number, number] | null
}

interface NonVinylBreakdownItem {
  format: string
  count: number
}

const readFiltersFromUrl = (): CollectionSelectedFilters => {
  const params = readSearchParams()
  return {
    genres: readParamList(params, FILTER_PARAM_KEYS.genres),
    styles: readParamList(params, FILTER_PARAM_KEYS.styles),
    labels: readParamList(params, FILTER_PARAM_KEYS.labels),
    types: readParamList(params, FILTER_PARAM_KEYS.types),
    sizes: readParamList(params, FILTER_PARAM_KEYS.sizes),
    countries: readParamList(params, FILTER_PARAM_KEYS.countries),
    yearRange: readParamRange(params, FILTER_PARAM_KEYS.yearRange)
  }
}

interface UseCollectionReturn {
  releases: DiscogsCollectionRelease[]
  vinylOnly: DiscogsCollectionRelease[]
  filteredReleases: DiscogsCollectionRelease[]
  isLoading: boolean
  isFetching: boolean
  shouldAnimateCards: boolean
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
  filterOptions: CollectionFilterOptions
  selectedFilters: CollectionSelectedFilters
  setSelectedGenres: (values: string[]) => void
  setSelectedStyles: (values: string[]) => void
  setSelectedLabels: (values: string[]) => void
  setSelectedTypes: (values: string[]) => void
  setSelectedSizes: (values: string[]) => void
  setSelectedCountries: (values: string[]) => void
  setYearRange: (range: [number, number] | null) => void
  clearFilters: () => void
  activeFilterCount: number
  nonVinylCount: number
  nonVinylBreakdown: NonVinylBreakdownItem[]
  hasCompleteCollection: boolean
}

export function useCollection(
  options: UseCollectionOptions = {}
): UseCollectionReturn {
  const { username } = useAuth()
  const urlFilters = useMemo(() => readFiltersFromUrl(), [])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<CollectionSortKey>(options.sort ?? 'added')
  const [sortOrder, setSortOrder] = useState<CollectionSortOrder>(
    options.sortOrder ?? 'desc'
  )
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    urlFilters.genres
  )
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    urlFilters.styles
  )
  const [selectedLabels, setSelectedLabels] = useState<string[]>(
    urlFilters.labels
  )
  const [selectedTypes, setSelectedTypes] = useState<string[]>(urlFilters.types)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(urlFilters.sizes)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    urlFilters.countries
  )
  const [yearRangeSelection, setYearRangeSelection] = useState<
    [number, number] | null
  >(urlFilters.yearRange)
  const [randomSeed, setRandomSeed] = useState(() => Date.now())
  const page = options.page ?? 1
  const isClientSort = sort === 'genre' || sort === 'random'
  const hasSearch = search.trim().length > 0
  const hasActiveFilters =
    selectedGenres.length > 0 ||
    selectedStyles.length > 0 ||
    selectedLabels.length > 0 ||
    selectedTypes.length > 0 ||
    selectedSizes.length > 0 ||
    selectedCountries.length > 0 ||
    yearRangeSelection !== null
  const shouldFetchAllPages = isClientSort || hasSearch || hasActiveFilters

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handlePopState = () => {
      const nextFilters = readFiltersFromUrl()
      setSelectedGenres(nextFilters.genres)
      setSelectedStyles(nextFilters.styles)
      setSelectedLabels(nextFilters.labels)
      setSelectedTypes(nextFilters.types)
      setSelectedSizes(nextFilters.sizes)
      setSelectedCountries(nextFilters.countries)
      setYearRangeSelection(nextFilters.yearRange)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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

  const serverSortOrder: CollectionSortOrder = isClientSort ? 'desc' : sortOrder

  const setSortWithRandom = (nextSort: CollectionSortKey) => {
    if (nextSort === 'random' && sort !== 'random') {
      setRandomSeed((seed) => seed + 1)
    }
    setSort(nextSort)
  }

  const setSortOrderWithRandom = (nextOrder: CollectionSortOrder) => {
    if (sort === 'random' && nextOrder !== sortOrder) {
      setRandomSeed((seed) => seed + 1)
    }
    setSortOrder(nextOrder)
  }

  const { data, isLoading, isError, error, isFetchedAfterMount, isFetching } =
    useQuery({
      queryKey: [
        'collection',
        username,
        shouldFetchAllPages ? 'all' : page,
        serverSort,
        serverSortOrder
      ],
      placeholderData: (previousData) => previousData,
      queryFn: async () => {
        if (!username) {
          throw new Error('Username is required')
        }

        const perPage = COLLECTION.PER_PAGE
        const fetchPage = (pageNumber: number) =>
          getCollection(username, {
            page: pageNumber,
            perPage,
            sort: serverSort,
            sortOrder: serverSortOrder
          })

        if (!shouldFetchAllPages) {
          return fetchPage(page)
        }

        const firstPage = await fetchPage(1)
        const totalPages = firstPage.pagination.pages

        if (totalPages <= 1) {
          return firstPage
        }

        const releases = [...firstPage.releases]
        for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
          const response = await fetchPage(currentPage)
          releases.push(...response.releases)
        }

        return { ...firstPage, releases }
      },
      enabled: !!username,
      staleTime: 5 * 60 * 1000 // 5 minutes
    })

  const [hasCachedDataAtMount] = useState(() => data !== undefined)

  const releases = data?.releases
  const shouldAnimateCards = !hasCachedDataAtMount && isFetchedAfterMount

  // Filter to vinyl only
  const vinylOnly = useMemo(() => {
    if (!releases) return []
    return releases.filter((release) =>
      isVinylRecord(release.basic_information.formats)
    )
  }, [releases])

  const nonVinylStats = useMemo(() => {
    if (!releases) {
      return { total: 0, breakdown: [] as NonVinylBreakdownItem[] }
    }

    const counts = new Map<string, number>()
    let total = 0

    for (const release of releases) {
      const formats = release.basic_information.formats ?? []
      if (isVinylRecord(formats)) continue
      total += 1
      const formatName =
        formats.find((format) => format.name && format.name !== 'Vinyl')
          ?.name ?? 'Unknown'
      counts.set(formatName, (counts.get(formatName) ?? 0) + 1)
    }

    const breakdown = Array.from(counts.entries())
      .map(([format, count]) => ({ format, count }))
      .sort((a, b) => b.count - a.count || a.format.localeCompare(b.format))

    return { total, breakdown }
  }, [releases])

  const filterOptions = useMemo<CollectionFilterOptions>(() => {
    const genres = new Set<string>()
    const styles = new Set<string>()
    const labels = new Set<string>()
    const types = new Set<string>()
    const sizes = new Set<string>()
    const countries = new Set<string>()
    let minYear = Number.POSITIVE_INFINITY
    let maxYear = 0

    for (const release of vinylOnly) {
      const info = release.basic_information
      for (const genre of info.genres ?? []) {
        genres.add(genre)
      }
      for (const style of info.styles ?? []) {
        styles.add(style)
      }
      for (const label of info.labels ?? []) {
        labels.add(label.name)
      }
      const { types: releaseTypes, sizes: releaseSizes } =
        extractVinylDescriptors(info.formats)
      for (const type of releaseTypes) {
        types.add(type)
      }
      for (const size of releaseSizes) {
        sizes.add(size)
      }
      if (info.country) {
        countries.add(info.country)
      }
      if (info.year && info.year > 0) {
        minYear = Math.min(minYear, info.year)
        maxYear = Math.max(maxYear, info.year)
      }
    }

    for (const genre of selectedGenres) {
      genres.add(genre)
    }
    for (const style of selectedStyles) {
      styles.add(style)
    }
    for (const label of selectedLabels) {
      labels.add(label)
    }
    for (const type of selectedTypes) {
      types.add(type)
    }
    for (const size of selectedSizes) {
      sizes.add(size)
    }
    for (const country of selectedCountries) {
      countries.add(country)
    }

    const yearBounds: [number, number] | null =
      Number.isFinite(minYear) && maxYear > 0 ? [minYear, maxYear] : null

    return {
      genres: sortValues(genres),
      styles: sortValues(styles),
      labels: sortValues(labels),
      types: sortValues(types),
      sizes: sortSizes(Array.from(sizes)),
      countries: sortValues(countries),
      yearBounds
    }
  }, [
    vinylOnly,
    selectedGenres,
    selectedStyles,
    selectedLabels,
    selectedTypes,
    selectedSizes,
    selectedCountries
  ])
  const yearRange = useMemo<[number, number] | null>(() => {
    if (!filterOptions.yearBounds) return yearRangeSelection
    if (!yearRangeSelection) return filterOptions.yearBounds
    const [minYear, maxYear] = filterOptions.yearBounds
    const next: [number, number] = [
      Math.max(yearRangeSelection[0], minYear),
      Math.min(yearRangeSelection[1], maxYear)
    ]
    if (next[0] > next[1]) return filterOptions.yearBounds
    return next
  }, [filterOptions.yearBounds, yearRangeSelection])

  // Apply search filter
  const searchedReleases = useMemo(() => {
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

  const filteredReleases = useMemo(() => {
    return searchedReleases.filter((release) => {
      const info = release.basic_information
      const { types: releaseTypes, sizes: releaseSizes } =
        extractVinylDescriptors(info.formats)

      const matchesGenres =
        selectedGenres.length === 0 ||
        selectedGenres.some((genre) => info.genres?.includes(genre))
      const matchesStyles =
        selectedStyles.length === 0 ||
        selectedStyles.some((style) => info.styles?.includes(style))
      const matchesLabels =
        selectedLabels.length === 0 ||
        selectedLabels.some((label) =>
          info.labels?.some((item) => item.name === label)
        )
      const matchesTypes =
        selectedTypes.length === 0 ||
        selectedTypes.some((type) => releaseTypes.includes(type))
      const matchesSizes =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => releaseSizes.includes(size))
      const matchesCountries =
        selectedCountries.length === 0 ||
        (!!info.country && selectedCountries.includes(info.country))

      let matchesYear = true
      if (yearRange) {
        if (!info.year || info.year <= 0) {
          matchesYear = false
        } else {
          matchesYear = info.year >= yearRange[0] && info.year <= yearRange[1]
        }
      }

      return (
        matchesGenres &&
        matchesStyles &&
        matchesLabels &&
        matchesTypes &&
        matchesSizes &&
        matchesCountries &&
        matchesYear
      )
    })
  }, [
    searchedReleases,
    selectedGenres,
    selectedStyles,
    selectedLabels,
    selectedTypes,
    selectedSizes,
    selectedCountries,
    yearRange
  ])

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

  const perPage = data?.pagination.per_page ?? COLLECTION.PER_PAGE
  const totalPages = shouldFetchAllPages
    ? Math.max(1, Math.ceil(sortedReleases.length / perPage))
    : (data?.pagination.pages ?? 1)
  const safePage = shouldFetchAllPages ? Math.min(page, totalPages) : page
  const pagedReleases = useMemo(() => {
    if (!shouldFetchAllPages) {
      return sortedReleases
    }

    const startIndex = (safePage - 1) * perPage
    return sortedReleases.slice(startIndex, startIndex + perPage)
  }, [shouldFetchAllPages, sortedReleases, safePage, perPage])

  const yearRangeActive =
    !!yearRange &&
    (!filterOptions.yearBounds ||
      yearRange[0] !== filterOptions.yearBounds[0] ||
      yearRange[1] !== filterOptions.yearBounds[1])

  useEffect(() => {
    updateSearchParams({
      [FILTER_PARAM_KEYS.genres]: selectedGenres,
      [FILTER_PARAM_KEYS.styles]: selectedStyles,
      [FILTER_PARAM_KEYS.labels]: selectedLabels,
      [FILTER_PARAM_KEYS.types]: selectedTypes,
      [FILTER_PARAM_KEYS.sizes]: selectedSizes,
      [FILTER_PARAM_KEYS.countries]: selectedCountries,
      [FILTER_PARAM_KEYS.yearRange]:
        yearRangeActive && yearRange ? `${yearRange[0]}-${yearRange[1]}` : null
    })
  }, [
    selectedGenres,
    selectedStyles,
    selectedLabels,
    selectedTypes,
    selectedSizes,
    selectedCountries,
    yearRange,
    yearRangeActive
  ])

  const activeFilterCount =
    selectedGenres.length +
    selectedStyles.length +
    selectedLabels.length +
    selectedTypes.length +
    selectedSizes.length +
    selectedCountries.length +
    (yearRangeActive ? 1 : 0)

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedStyles([])
    setSelectedLabels([])
    setSelectedTypes([])
    setSelectedSizes([])
    setSelectedCountries([])
    setYearRangeSelection(null)
  }

  const pagination = data
    ? shouldFetchAllPages
      ? {
          page: safePage,
          pages: totalPages,
          total: sortedReleases.length,
          perPage
        }
      : {
          page: data.pagination.page,
          pages: data.pagination.pages,
          total:
            data.pagination.pages <= 1
              ? vinylOnly.length
              : data.pagination.items,
          perPage: data.pagination.per_page
        }
    : null

  const hasCompleteCollection =
    shouldFetchAllPages || (data?.pagination.pages ?? 0) <= 1

  return {
    releases: releases ?? [],
    vinylOnly,
    filteredReleases: pagedReleases,
    isLoading,
    isFetching,
    shouldAnimateCards,
    isError,
    error: error as Error | null,
    pagination,
    search,
    setSearch,
    sort,
    setSort: setSortWithRandom,
    sortOrder,
    setSortOrder: setSortOrderWithRandom,
    filterOptions,
    selectedFilters: {
      genres: selectedGenres,
      styles: selectedStyles,
      labels: selectedLabels,
      types: selectedTypes,
      sizes: selectedSizes,
      countries: selectedCountries,
      yearRange
    },
    setSelectedGenres,
    setSelectedStyles,
    setSelectedLabels,
    setSelectedTypes,
    setSelectedSizes,
    setSelectedCountries,
    setYearRange: setYearRangeSelection,
    clearFilters,
    activeFilterCount,
    nonVinylCount: nonVinylStats.total,
    nonVinylBreakdown: nonVinylStats.breakdown,
    hasCompleteCollection
  }
}
