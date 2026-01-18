import type { DiscogsCollectionRelease } from '@/types/discogs'
import { VinylCard } from './vinyl-card'
import { VinylCardSkeleton } from './vinyl-card-skeleton'
import { CollectionEmptyState } from './collection-empty-state'

interface VinylGridProps {
  releases: DiscogsCollectionRelease[]
  isLoading: boolean
  shouldAnimate: boolean
  animationClassName?: string
}

export function VinylGrid({
  releases,
  isLoading,
  shouldAnimate,
  animationClassName
}: VinylGridProps) {
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
    return <CollectionEmptyState />
  }

  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {releases.map((release, index) => (
        <div
          key={release.instance_id}
          className={
            shouldAnimate
              ? (animationClassName ?? 'animate-card-pop')
              : undefined
          }
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
