import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { AlertCircle } from 'lucide-react'
import { useCollection } from '@/hooks/use-collection'
import { VinylGrid } from '@/components/collection/vinyl-grid'
import { CollectionToolbar } from '@/components/collection/collection-toolbar'
import { PaginationControls } from '@/components/collection/pagination-controls'

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
    search,
    setSearch,
    sort,
    setSort,
    sortOrder,
    setSortOrder
  } = useCollection({ page })
  const visibleCount = filteredReleases.length
  const rangeStart = visibleCount > 0 ? 1 : 0
  const rangeEnd = visibleCount

  // Reset to page 1 when sort changes
  const handleSortChange = (newSort: typeof sort) => {
    setSort(newSort)
    setPage(1)
  }

  const handleSortOrderChange = (newOrder: typeof sortOrder) => {
    setSortOrder(newOrder)
    setPage(1)
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
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
      <div>
        <h1 className="text-2xl font-bold">{t('collection.title')}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('collection.showing', {
            count: visibleCount,
            start: rangeStart,
            end: rangeEnd,
            total: visibleCount
          })}
        </p>
      </div>

      <CollectionToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={handleSortChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
      />

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
