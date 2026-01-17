import { useTranslation } from 'react-i18next'
import { Disc3 } from 'lucide-react'
import type { DiscogsCollectionRelease } from '@/types/discogs'
import { VinylCard } from './vinyl-card'
import { VinylCardSkeleton } from './vinyl-card-skeleton'

interface VinylGridProps {
  releases: DiscogsCollectionRelease[]
  isLoading: boolean
  shouldAnimate: boolean
}

export function VinylGrid({
  releases,
  isLoading,
  shouldAnimate
}: VinylGridProps) {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <VinylCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (releases.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="animate-in spin-in duration-700 fill-mode-backwards">
          <Disc3 className="h-20 w-20 text-muted-foreground opacity-50" />
        </div>
        <p className="mt-6 text-lg font-medium text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-backwards delay-200">
          {t('collection.empty')}
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {releases.map((release, index) => (
        <div
          key={release.instance_id}
          className={shouldAnimate ? 'animate-card-pop' : undefined}
          style={
            shouldAnimate
              ? { animationDelay: `${Math.min(index * 30, 300)}ms` }
              : undefined
          }
        >
          <VinylCard release={release} />
        </div>
      ))}
    </div>
  )
}
