import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface VinylCardSkeletonProps {
  className?: string
}

export function VinylCardSkeleton({ className }: VinylCardSkeletonProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg bg-card shadow-sm ring-1 ring-border/30',
        className
      )}
    >
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="mt-2 h-3 w-1/2" />
        <Skeleton className="mt-3 h-3 w-1/3" />
      </div>
    </div>
  )
}
