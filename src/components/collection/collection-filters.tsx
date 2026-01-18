import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import type {
  CollectionFilterOptions,
  FilterOption
} from '@/hooks/use-collection'

interface CollectionSelectedFilters {
  genres: string[]
  styles: string[]
  labels: string[]
  types: string[]
  sizes: string[]
  countries: string[]
  yearRange: [number, number] | null
}

export interface CollectionFiltersProps {
  options: CollectionFilterOptions
  selected: CollectionSelectedFilters
  setSelectedGenres: (values: string[]) => void
  setSelectedStyles: (values: string[]) => void
  setSelectedLabels: (values: string[]) => void
  setSelectedTypes: (values: string[]) => void
  setSelectedSizes: (values: string[]) => void
  setSelectedCountries: (values: string[]) => void
  setYearRange: (range: [number, number] | null) => void
  clearFilters: () => void
  activeFilterCount: number
  className?: string
}

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]

interface FilterGroupProps {
  idPrefix: string
  title: string
  options: FilterOption[]
  selected: string[]
  onChange: (next: string[]) => void
  columns?: 'single' | 'double'
}

function FilterGroup({
  idPrefix,
  title,
  options,
  selected,
  onChange,
  columns = 'double'
}: FilterGroupProps) {
  const { t } = useTranslation()
  const gridClass =
    columns === 'single' ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{title}</h4>
        {selected.length > 0 && (
          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
            {selected.length}
          </Badge>
        )}
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {t('collection.filters.empty')}
        </p>
      ) : (
        <div className={cn('grid gap-2', gridClass)}>
          {options.map((option, index) => {
            const id = `${idPrefix}-${index}`
            const isChecked = selected.includes(option.value)
            return (
              <label
                key={option.value}
                htmlFor={id}
                className="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={() =>
                    onChange(toggleValue(selected, option.value))
                  }
                />
                <span className="flex-1 line-clamp-1">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    ({option.count})
                  </span>{' '}
                  {option.value}
                </span>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterContent({
  options,
  selected,
  setSelectedGenres,
  setSelectedStyles,
  setSelectedLabels,
  setSelectedTypes,
  setSelectedSizes,
  setSelectedCountries,
  setYearRange,
  clearFilters,
  activeFilterCount,
  layout
}: Omit<CollectionFiltersProps, 'className'> & {
  layout: 'mobile' | 'desktop'
}) {
  const { t } = useTranslation()
  const yearBounds = options.yearBounds
  const yearBoundsMin = yearBounds?.[0]
  const yearBoundsMax = yearBounds?.[1]
  const yearRange = selected.yearRange ?? yearBounds
  const yearRangeStart = yearRange?.[0]
  const yearRangeEnd = yearRange?.[1]
  const hasActiveFilters = activeFilterCount > 0
  const isDesktop = layout === 'desktop'
  const groupColumns = isDesktop ? 'single' : 'double'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        className={cn(
          'flex items-center justify-between border-b px-4 py-3',
          !isDesktop && 'pr-12'
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {t('collection.filters.title')}
          </h3>
          {hasActiveFilters && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
        >
          {t('collection.filters.clear')}
        </Button>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div
          className={cn(
            isDesktop
              ? 'grid gap-6 px-4 py-4 md:grid-cols-3 lg:grid-cols-4'
              : 'space-y-6 px-4 py-4'
          )}
        >
          <div className={cn('space-y-3', isDesktop ? 'col-span-full' : '')}>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">
                {t('collection.filters.yearRange')}
              </h4>
              {yearRangeStart !== undefined && yearRangeEnd !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {yearRangeStart}-{yearRangeEnd}
                </span>
              )}
            </div>
            {yearBoundsMin !== undefined &&
            yearBoundsMax !== undefined &&
            yearRange ? (
              <Slider
                value={yearRange}
                min={yearBoundsMin}
                max={yearBoundsMax}
                step={1}
                onValueChange={(value) => {
                  const [start, end] = value
                  if (start === undefined || end === undefined) return
                  setYearRange([start, end])
                }}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {t('collection.filters.anyYear')}
              </p>
            )}
          </div>

          <div className={cn(isDesktop ? 'col-span-full' : '')}>
            <Separator />
          </div>

          <FilterGroup
            idPrefix="filter-genre"
            title={t('collection.filters.genre')}
            options={options.genres}
            selected={selected.genres}
            onChange={setSelectedGenres}
            columns={groupColumns}
          />

          <FilterGroup
            idPrefix="filter-style"
            title={t('collection.filters.style')}
            options={options.styles}
            selected={selected.styles}
            onChange={setSelectedStyles}
            columns={groupColumns}
          />

          <FilterGroup
            idPrefix="filter-label"
            title={t('collection.filters.label')}
            options={options.labels}
            selected={selected.labels}
            onChange={setSelectedLabels}
            columns={groupColumns}
          />

          <FilterGroup
            idPrefix="filter-type"
            title={t('collection.filters.vinylType')}
            options={options.types}
            selected={selected.types}
            onChange={setSelectedTypes}
            columns={groupColumns}
          />

          <FilterGroup
            idPrefix="filter-size"
            title={t('collection.filters.size')}
            options={options.sizes}
            selected={selected.sizes}
            onChange={setSelectedSizes}
            columns="single"
          />

          <FilterGroup
            idPrefix="filter-country"
            title={t('collection.filters.country')}
            options={options.countries}
            selected={selected.countries}
            onChange={setSelectedCountries}
            columns={groupColumns}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

export function CollectionFilters({
  options,
  selected,
  setSelectedGenres,
  setSelectedStyles,
  setSelectedLabels,
  setSelectedTypes,
  setSelectedSizes,
  setSelectedCountries,
  setYearRange,
  clearFilters,
  activeFilterCount,
  className
}: CollectionFiltersProps) {
  const { t } = useTranslation()
  const isMobile = useIsMobile()

  const trigger = (
    <Button variant="outline" size="sm" className={cn('gap-2', className)}>
      <SlidersHorizontal className="h-4 w-4" />
      <span className="text-sm">{t('collection.filters.button')}</span>
      {activeFilterCount > 0 && (
        <Badge variant="secondary">{activeFilterCount}</Badge>
      )}
    </Button>
  )

  const content = (
    <FilterContent
      options={options}
      selected={selected}
      setSelectedGenres={setSelectedGenres}
      setSelectedStyles={setSelectedStyles}
      setSelectedLabels={setSelectedLabels}
      setSelectedTypes={setSelectedTypes}
      setSelectedSizes={setSelectedSizes}
      setSelectedCountries={setSelectedCountries}
      setYearRange={setYearRange}
      clearFilters={clearFilters}
      activeFilterCount={activeFilterCount}
      layout={isMobile ? 'mobile' : 'desktop'}
    />
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="right" className="p-0">
          {content}
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        className="h-[70vh] w-[90vw] max-w-[920px] p-0 md:w-[680px] lg:w-[920px]"
      >
        {content}
      </PopoverContent>
    </Popover>
  )
}
