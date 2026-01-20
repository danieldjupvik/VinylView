import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
export function VinylTableSkeleton(): React.JSX.Element {
  const { t } = useTranslation()

  return (
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
        {Array.from({ length: 8 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key -- Skeleton items have no stable ID; index is safe for static placeholder list
          <TableRow key={`skeleton-${index}`} className="group">
            <TableCell className="w-16 min-w-[64px]">
              <Skeleton className="h-10 w-10 rounded-sm" />
            </TableCell>
            <TableCell className="w-auto whitespace-normal sm:w-[40%] sm:min-w-[240px]">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </TableCell>
            <TableCell className="w-16">
              <Skeleton className="h-3 w-10" />
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <Skeleton className="h-3 w-20" />
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Skeleton className="h-3 w-28" />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <Skeleton className="h-3 w-24" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
