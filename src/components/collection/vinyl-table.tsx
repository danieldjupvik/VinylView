import { useState } from 'react'
import { Disc3 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DiscogsCollectionRelease, DiscogsFormat } from '@/types/discogs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { VinylTableSkeleton } from './vinyl-table-skeleton'
import { CollectionEmptyState } from './collection-empty-state'

interface VinylTableProps {
  releases: DiscogsCollectionRelease[]
  isLoading: boolean
  shouldAnimate: boolean
}

const formatGenres = (genres: string[]) => {
  const parts = genres
    .flatMap((genre) => genre.split(',').map((part) => part.trim()))
    .filter(Boolean)
  const limited = parts.slice(0, 2)
  return limited.join(', ')
}

const formatFormats = (formats: DiscogsFormat[]) => {
  const unique = Array.from(
    new Set((formats ?? []).map((format) => format.name).filter(Boolean))
  )
  return unique.join(', ')
}

type TranslationFunction = ReturnType<typeof useTranslation>['t']

interface VinylTableRowProps {
  release: DiscogsCollectionRelease
  index: number
  shouldAnimate: boolean
  t: TranslationFunction
}

function VinylTableRow({
  release,
  index,
  shouldAnimate,
  t
}: VinylTableRowProps) {
  const [imageError, setImageError] = useState(false)
  const info = release.basic_information
  const artistName = info.artists?.length
    ? info.artists.map((artist) => artist.name).join(', ')
    : t('collection.unknownArtist')
  const coverImage = info.cover_image || info.thumb
  const year = info.year > 0 ? info.year : null
  const genreText = info.genres?.length ? formatGenres(info.genres) : null
  const labelText = info.labels?.[0]?.name ?? null
  const formatText = formatFormats(info.formats)
  const animationDelay = Math.min(index * 30, 300)
  const showImage = Boolean(coverImage) && !imageError

  return (
    <TableRow
      className={
        shouldAnimate ? 'animate-view-switch cursor-pointer' : 'cursor-pointer'
      }
      style={
        shouldAnimate ? { animationDelay: `${animationDelay}ms` } : undefined
      }
    >
      <TableCell className="w-16 min-w-[64px]">
        {showImage ? (
          <img
            src={coverImage}
            alt={`${artistName} - ${info.title}`}
            className="h-10 w-10 rounded-sm bg-muted/40 object-contain"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
            <Disc3 className="h-5 w-5 text-muted-foreground/70" />
          </div>
        )}
      </TableCell>
      <TableCell className="w-auto sm:w-[40%] sm:min-w-[240px] whitespace-normal">
        <div className="flex flex-col gap-1">
          <span
            className="line-clamp-1 text-sm font-semibold leading-tight"
            title={info.title}
          >
            {info.title}
          </span>
          <span
            className="line-clamp-1 text-xs text-muted-foreground"
            title={artistName}
          >
            {artistName}
          </span>
        </div>
      </TableCell>
      <TableCell className="tabular-nums w-16">{year ?? '-'}</TableCell>
      <TableCell
        className="hidden max-w-[160px] truncate md:table-cell"
        title={genreText ?? undefined}
      >
        {genreText ?? '-'}
      </TableCell>
      <TableCell
        className="hidden max-w-[220px] truncate sm:table-cell"
        title={labelText ?? undefined}
      >
        {labelText ?? '-'}
      </TableCell>
      <TableCell
        className="hidden max-w-[200px] truncate lg:table-cell"
        title={formatText || undefined}
      >
        {formatText || '-'}
      </TableCell>
    </TableRow>
  )
}

export function VinylTable({
  releases,
  isLoading,
  shouldAnimate
}: VinylTableProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card/60 shadow-sm backdrop-blur">
        <VinylTableSkeleton />
      </div>
    )
  }

  if (releases.length === 0) {
    return <CollectionEmptyState />
  }

  return (
    <div className="rounded-xl border bg-card/60 shadow-sm backdrop-blur overflow-hidden">
      <Table className="table-fixed">
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-16 min-w-[64px]">
              <span className="sr-only">{t('collection.table.cover')}</span>
            </TableHead>
            <TableHead className="w-auto sm:w-[40%] sm:min-w-[240px]">
              {t('collection.table.titleArtist')}
            </TableHead>
            <TableHead className="w-16">{t('collection.table.year')}</TableHead>
            <TableHead className="hidden md:table-cell">
              {t('collection.table.genre')}
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              {t('collection.table.label')}
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              {t('collection.table.format')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {releases.map((release, index) => (
            <VinylTableRow
              key={release.instance_id}
              release={release}
              index={index}
              shouldAnimate={shouldAnimate}
              t={t}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
