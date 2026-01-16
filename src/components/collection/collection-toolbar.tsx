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
import type { CollectionSortKey, CollectionSortOrder } from '@/types/discogs'

interface CollectionToolbarProps {
  search: string
  onSearchChange: (search: string) => void
  sort: CollectionSortKey
  onSortChange: (sort: CollectionSortKey) => void
  sortOrder: CollectionSortOrder
  onSortOrderChange: (order: CollectionSortOrder) => void
}

export function CollectionToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  sortOrder,
  onSortOrderChange
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
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('collection.search')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex items-center gap-2">
        <Select value={sort} onValueChange={onSortChange}>
          <SelectTrigger className="w-[140px]">
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
          size="sm"
          onClick={toggleSortOrder}
          title={sortOrderLabel}
          className="gap-2"
        >
          {isRandomSort ? (
            <Shuffle className="h-4 w-4" />
          ) : sortOrder === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">{sortOrderLabel}</span>
        </Button>
      </div>
    </div>
  )
}
