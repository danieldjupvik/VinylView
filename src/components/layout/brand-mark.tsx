import { Disc3 } from 'lucide-react'

import { cn } from '@/lib/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg'

interface BrandMarkProps {
  size?: BrandMarkSize
  spinning?: boolean
  className?: string
  iconClassName?: string
}

const sizeClasses: Record<BrandMarkSize, { container: string; icon: string }> =
  {
    sm: { container: 'size-9', icon: 'size-4' },
    md: { container: 'size-12', icon: 'size-6' },
    lg: { container: 'size-20', icon: 'size-10' }
  }

export function BrandMark({
  size = 'md',
  spinning = false,
  className,
  iconClassName
}: BrandMarkProps) {
  const classes = sizeClasses[size]

  return (
    <div
      className={cn(
        'bg-secondary text-secondary-foreground ring-border/70 flex aspect-square items-center justify-center rounded-full shadow-sm ring-1',
        classes.container,
        className
      )}
    >
      <Disc3
        className={cn(
          classes.icon,
          spinning && 'animate-vinyl-spin',
          iconClassName
        )}
      />
    </div>
  )
}
