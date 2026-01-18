import { Search, ArrowDown, ArrowUp, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  CollectionFilters,
  type CollectionFiltersProps
} from '@/components/collection/collection-filters'
import { ViewToggle } from '@/components/collection/view-toggle'
import type { ViewMode } from '@/lib/storage'
import type { CollectionSortKey, CollectionSortOrder } from '@/types/discogs'

interface CollectionToolbarProps {
  search: string
  onSearchChange: (search: string) => void
  sort: CollectionSortKey
  onSortChange: (sort: CollectionSortKey) => void
  sortOrder: CollectionSortOrder
  onSortOrderChange: (order: CollectionSortOrder) => void
  viewMode: ViewMode
  onViewToggle: () => void
  filters: CollectionFiltersProps
}

export function CollectionToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  sortOrder,
  onSortOrderChange,
  viewMode,
  onViewToggle,
  filters
}: CollectionToolbarProps) {
  const { t } = useTranslation()

  const toggleSortOrder = () => {
    onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  const isTimelineSort = sort === 'added' || sort === 'releaseYear'
  const isAlphaSort =
    sort === 'artist' ||
    sort === 'title' ||
    sort === 'label' ||
    sort === 'format' ||
    sort === 'genre'
  const isRandomSort = sort === 'random'
  const sortOrderLabel = isRandomSort
    ? t('collection.sortOrder.shuffle')
    : isTimelineSort
      ? sortOrder === 'asc'
        ? t('collection.sortOrder.oldest')
        : t('collection.sortOrder.newest')
      : isAlphaSort
        ? sortOrder === 'asc'
          ? t('collection.sortOrder.az')
          : t('collection.sortOrder.za')
        : sortOrder === 'asc'
          ? t('collection.sortOrder.asc')
          : t('collection.sortOrder.desc')

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="group relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground" />
        <Input
          type="search"
          placeholder={t('collection.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <ViewToggle viewMode={viewMode} onToggle={onViewToggle} />
        <CollectionFilters {...filters} />
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger
            size="sm"
            className="w-[120px] px-2 sm:w-[140px] sm:px-3"
          >
            <SelectValue placeholder={t('collection.sort.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{t('collection.sortGroup.timeline')}</SelectLabel>
              <SelectItem value="added">
                {t('collection.sort.dateAdded')}
              </SelectItem>
              <SelectItem value="releaseYear">
                {t('collection.sort.releaseYear')}
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{t('collection.sortGroup.albumInfo')}</SelectLabel>
              <SelectItem value="artist">
                {t('collection.sort.artist')}
              </SelectItem>
              <SelectItem value="title">
                {t('collection.sort.title')}
              </SelectItem>
              <SelectItem value="label">
                {t('collection.sort.label')}
              </SelectItem>
              <SelectItem value="format">
                {t('collection.sort.format')}
              </SelectItem>
              <SelectItem value="genre">
                {t('collection.sort.genre')}
              </SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{t('collection.sortGroup.other')}</SelectLabel>
              <SelectItem value="random">
                {t('collection.sort.random')}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleSortOrder}
          title={sortOrderLabel}
          aria-label={sortOrderLabel}
          className="transition-all duration-200 hover:scale-110"
        >
          {isRandomSort ? (
            <Shuffle className="h-4 w-4" />
          ) : sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
