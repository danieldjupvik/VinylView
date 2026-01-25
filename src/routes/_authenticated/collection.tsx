import { createFileRoute } from '@tanstack/react-router'
import { AlertCircle, RotateCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CollectionToolbar } from '@/components/collection/collection-toolbar'
import { PaginationControls } from '@/components/collection/pagination-controls'
import { VinylGrid } from '@/components/collection/vinyl-grid'
import { VinylTable } from '@/components/collection/vinyl-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCollection } from '@/hooks/use-collection'
import { usePreferencesStore } from '@/stores/preferences-store'

export const Route = createFileRoute('/_authenticated/collection')({
  component: CollectionPage
})

function CollectionPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())
  const viewMode = usePreferencesStore((state) => state.viewMode)
  const setViewMode = usePreferencesStore((state) => state.setViewMode)

  const toggleView = () => {
    setViewMode(viewMode === 'grid' ? 'table' : 'grid')
  }
  const [isViewSwitching, setIsViewSwitching] = useState(false)
  const [hasViewToggled, setHasViewToggled] = useState(false)
  const viewSwitchTimeoutRef = useRef<number | null>(null)

  const {
    filteredReleases,
    isLoading,
    isFetching,
    dataUpdatedAt,
    refetch,
    shouldAnimateCards,
    isError,
    error,
    pagination,
    nonVinylCount,
    nonVinylBreakdown,
    hasCompleteCollection,
    search,
    setSearch,
    sort,
    setSort,
    sortOrder,
    setSortOrder,
    filterOptions,
    selectedFilters,
    setSelectedGenres,
    setSelectedStyles,
    setSelectedLabels,
    setSelectedTypes,
    setSelectedSizes,
    setSelectedCountries,
    setYearRange,
    clearFilters,
    reshuffleRandom,
    activeFilterCount
  } = useCollection({ page })
  const visibleCount = filteredReleases.length
  const totalCount = pagination?.total ?? visibleCount
  const perPage = pagination?.perPage ?? visibleCount
  const currentPage = pagination?.page ?? page
  const rangeStart = visibleCount > 0 ? (currentPage - 1) * perPage + 1 : 0
  const rangeEnd =
    visibleCount > 0 ? Math.min(rangeStart + visibleCount - 1, totalCount) : 0
  const showNonVinyl = hasCompleteCollection && nonVinylCount > 0
  const nonVinylSummary = nonVinylBreakdown
    .map((item) => `${item.count} ${item.format}`)
    .join(', ')

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now())
    }, 30_000)

    return () => { window.clearInterval(interval); }
  }, [])

  useEffect(() => {
    return () => {
      if (viewSwitchTimeoutRef.current !== null) {
        window.clearTimeout(viewSwitchTimeoutRef.current)
      }
    }
  }, [])

  // Memoize Intl.NumberFormat instances by locale and unit
  const numberFormatters = useMemo(() => {
    const cache = new Map<string, Intl.NumberFormat>()

    const getFormatter = (unit: Intl.RelativeTimeFormatUnit) => {
      const key = `${i18n.language}-${unit}`
      if (!cache.has(key)) {
        cache.set(
          key,
          new Intl.NumberFormat(i18n.language, {
            style: 'unit',
            unit,
            unitDisplay: 'short'
          })
        )
      }
      return cache.get(key)!
    }

    return { getFormatter }
  }, [i18n.language])

  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) {
      return t('collection.notUpdated')
    }

    const diffSeconds = Math.max(0, Math.floor((now - dataUpdatedAt) / 1000))
    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
      ['day', 86_400],
      ['hour', 3_600],
      ['minute', 60],
      ['second', 1]
    ]

    for (const [unit, secondsInUnit] of units) {
      if (diffSeconds >= secondsInUnit || unit === 'second') {
        const value = Math.round(diffSeconds / secondsInUnit)
        return t('collection.lastUpdated', {
          time: numberFormatters.getFormatter(unit).format(value)
        })
      }
    }

    return t('collection.lastUpdated', {
      time: numberFormatters.getFormatter('second').format(0)
    })
  }, [dataUpdatedAt, now, t, numberFormatters])

  // Reset to page 1 when sort changes
  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort)
    setPage(1)
  }

  const handleSortOrderChange = (newOrder: typeof sortOrder) => {
    setSortOrder(newOrder)
    setPage(1)
  }

  const handleReshuffle = () => {
    reshuffleRandom()
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(1)
  }

  const handleSetSelectedGenres = (values: string[]) => {
    setSelectedGenres(values)
    setPage(1)
  }

  const handleSetSelectedStyles = (values: string[]) => {
    setSelectedStyles(values)
    setPage(1)
  }

  const handleSetSelectedLabels = (values: string[]) => {
    setSelectedLabels(values)
    setPage(1)
  }

  const handleSetSelectedTypes = (values: string[]) => {
    setSelectedTypes(values)
    setPage(1)
  }

  const handleSetSelectedSizes = (values: string[]) => {
    setSelectedSizes(values)
    setPage(1)
  }

  const handleSetSelectedCountries = (values: string[]) => {
    setSelectedCountries(values)
    setPage(1)
  }

  const handleSetYearRange = (range: [number, number] | null) => {
    setYearRange(range)
    setPage(1)
  }

  const handleClearFilters = () => {
    clearFilters()
    setPage(1)
  }

  const handleViewToggle = () => {
    toggleView()
    setIsViewSwitching(true)
    setHasViewToggled(true)
    if (viewSwitchTimeoutRef.current !== null) {
      window.clearTimeout(viewSwitchTimeoutRef.current)
    }
    viewSwitchTimeoutRef.current = window.setTimeout(() => {
      setIsViewSwitching(false)
    }, 420)
  }

  const shouldAnimateItems =
    isViewSwitching || (shouldAnimateCards && !hasViewToggled)
  const gridAnimationClassName = isViewSwitching
    ? 'animate-view-switch'
    : 'animate-card-pop'

  if (isError) {
    return (
      <div className="animate-in fade-in zoom-in-95 flex flex-col items-center justify-center p-6 text-center duration-300">
        <AlertCircle className="text-destructive h-12 w-12" />
        <h2 className="mt-4 text-lg font-semibold">{t('errors.generic')}</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          {error?.message || t('errors.network')}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <h1 className="text-2xl font-bold">{t('collection.title')}</h1>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <span className="tabular-nums">{lastUpdatedLabel}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                handleClearFilters()
                void refetch()
              }}
              disabled={isFetching}
              aria-label={t('collection.refresh')}
              title={t('collection.refresh')}
            >
              <RotateCw className={isFetching ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
        <div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <p className="tabular-nums">
            {t('collection.showing', {
              count: visibleCount,
              start: rangeStart,
              end: rangeEnd,
              total: totalCount
            })}
          </p>
          {showNonVinyl ? (
            <div className="animate-in fade-in slide-in-from-right flex items-center gap-2 duration-500">
              <span>{t('collection.nonVinylHidden')}</span>
              <Badge variant="secondary" className="font-normal">
                {nonVinylSummary}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-3 fill-mode-backwards delay-100 duration-500">
        <div className="bg-card/60 rounded-xl border p-4 shadow-sm backdrop-blur">
          <CollectionToolbar
            search={search}
            onSearchChange={handleSearchChange}
            sort={sort}
            onSortChange={handleSortChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
            onReshuffle={handleReshuffle}
            viewMode={viewMode}
            onViewToggle={handleViewToggle}
            filters={{
              options: filterOptions,
              selected: selectedFilters,
              setSelectedGenres: handleSetSelectedGenres,
              setSelectedStyles: handleSetSelectedStyles,
              setSelectedLabels: handleSetSelectedLabels,
              setSelectedTypes: handleSetSelectedTypes,
              setSelectedSizes: handleSetSelectedSizes,
              setSelectedCountries: handleSetSelectedCountries,
              setYearRange: handleSetYearRange,
              clearFilters: handleClearFilters,
              activeFilterCount
            }}
          />
        </div>
      </div>

      {viewMode === 'grid' ? (
        <VinylGrid
          releases={filteredReleases}
          isLoading={isLoading || isFetching}
          shouldAnimate={shouldAnimateItems}
          animationClassName={gridAnimationClassName}
        />
      ) : (
        <VinylTable
          releases={filteredReleases}
          isLoading={isLoading || isFetching}
          shouldAnimate={shouldAnimateItems}
        />
      )}

      {pagination ? (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      ) : null}
    </div>
  )
}
