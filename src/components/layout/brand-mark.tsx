import { cn } from '@/lib/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg'

interface BrandMarkProps {
  size?: BrandMarkSize
  spinning?: boolean
  className?: string
}

const sizeClasses: Record<BrandMarkSize, string> = {
  sm: 'w-12',
  md: 'w-20',
  lg: 'w-32'
}

export function BrandMark({
  size = 'md',
  spinning = false,
  className
}: BrandMarkProps): React.JSX.Element {
  return (
    <img
      src="/logo.png"
      alt="VinylDeck"
      className={cn(
        sizeClasses[size],
        spinning && 'animate-vinyl-spin',
        className
      )}
    />
  )
}
