import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { useCollection } from '@/hooks/use-collection'
import { VinylGrid } from '@/components/collection/vinyl-grid'
import { CollectionToolbar } from '@/components/collection/collection-toolbar'
import { PaginationControls } from '@/components/collection/pagination-controls'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/collection')({
  component: CollectionPage
})

function CollectionPage() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)

  const {
    filteredReleases,
    isLoading,
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
        <h1 className="text-2xl font-bold">{t('collection.title')}</h1>
        <div className="mt-2 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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

      <VinylGrid releases={filteredReleases} isLoading={isLoading} />

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
