import { useEffect, useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertCircle, RotateCw } from 'lucide-react'
import { useCollection } from '@/hooks/use-collection'
import { VinylGrid } from '@/components/collection/vinyl-grid'
import { CollectionToolbar } from '@/components/collection/collection-toolbar'
import { PaginationControls } from '@/components/collection/pagination-controls'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authenticated/collection')({
  component: CollectionPage
})

function CollectionPage() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [now, setNow] = useState(() => Date.now())

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

    return () => window.clearInterval(interval)
  }, [])

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
        const numberFormatter = new Intl.NumberFormat(i18n.language, {
          style: 'unit',
          unit,
          unitDisplay: 'short'
        })
        return t('collection.lastUpdated', {
          time: numberFormatter.format(value)
        })
      }
    }

    const fallbackFormatter = new Intl.NumberFormat(i18n.language, {
      style: 'unit',
      unit: 'second',
      unitDisplay: 'short'
    })
    return t('collection.lastUpdated', {
      time: fallbackFormatter.format(0)
    })
  }, [dataUpdatedAt, now, i18n.language, t])

  // Reset to page 1 when sort changes
  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort)
    setPage(1)
  }

  const handleSortOrderChange = (newOrder: typeof sortOrder) => {
    setSortOrder(newOrder)
    setPage(1)
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-300">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-lg font-semibold">{t('errors.generic')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <p className="tabular-nums">
            {t('collection.showing', {
              count: visibleCount,
              start: rangeStart,
              end: rangeEnd,
              total: totalCount
            })}
          </p>
          {showNonVinyl ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right duration-500">
              <span>{t('collection.nonVinylHidden')}</span>
              <Badge variant="secondary" className="font-normal">
                {nonVinylSummary}
              </Badge>
            </div>
          ) : null}
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-100">
        <div className="rounded-xl border bg-card/60 p-4 shadow-sm backdrop-blur">
          <CollectionToolbar
            search={search}
            onSearchChange={handleSearchChange}
            sort={sort}
            onSortChange={handleSortChange}
            sortOrder={sortOrder}
            onSortOrderChange={handleSortOrderChange}
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

      <VinylGrid
        releases={filteredReleases}
        isLoading={isLoading || isFetching}
        shouldAnimate={shouldAnimateCards}
      />

      {pagination && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
