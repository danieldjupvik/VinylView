import { cn } from '@/lib/utils'
import type { DiscogsCollectionRelease } from '@/types/discogs'
import { Disc3 } from 'lucide-react'

interface VinylCardProps {
  release: DiscogsCollectionRelease
  className?: string
}

interface VinylInfo {
  color?: string
  weight?: string
}

function getColorStyles(colorName: string): {
  bg: string
  text: string
  border: string
} {
  const color = colorName.toLowerCase()

  // Map color names to Tailwind-compatible styles
  if (color.includes('yellow') || color.includes('gold')) {
    return {
      bg: 'bg-yellow-400/90',
      text: 'text-yellow-950',
      border: 'ring-yellow-900/50'
    }
  }
  if (color.includes('pink') || color.includes('magenta')) {
    return {
      bg: 'bg-pink-500/90',
      text: 'text-white',
      border: 'ring-pink-700/60'
    }
  }
  if (color.includes('red')) {
    return {
      bg: 'bg-red-500/90',
      text: 'text-white',
      border: 'ring-red-700/60'
    }
  }
  if (color.includes('blue') || color.includes('cyan')) {
    return {
      bg: 'bg-blue-500/90',
      text: 'text-white',
      border: 'ring-blue-700/60'
    }
  }
  if (color.includes('green') || color.includes('lime')) {
    return {
      bg: 'bg-green-500/90',
      text: 'text-white',
      border: 'ring-green-700/60'
    }
  }
  if (
    color.includes('purple') ||
    color.includes('violet') ||
    color.includes('lavender')
  ) {
    return {
      bg: 'bg-purple-500/90',
      text: 'text-white',
      border: 'ring-purple-700/60'
    }
  }
  if (color.includes('orange') || color.includes('amber')) {
    return {
      bg: 'bg-orange-500/90',
      text: 'text-white',
      border: 'ring-orange-700/60'
    }
  }
  if (
    color.includes('white') ||
    color.includes('clear') ||
    color.includes('transparent') ||
    color.includes('translucent')
  ) {
    return {
      bg: 'bg-white/95',
      text: 'text-gray-900',
      border: 'ring-gray-900/50'
    }
  }
  if (color.includes('smoke') || color.includes('smoky')) {
    return {
      bg: 'bg-gray-500/90',
      text: 'text-white',
      border: 'ring-gray-700/60'
    }
  }
  if (color.includes('black')) {
    return {
      bg: 'bg-gray-900/90',
      text: 'text-white',
      border: 'ring-gray-700/60'
    }
  }
  if (
    color.includes('brown') ||
    color.includes('bronze') ||
    color.includes('tan')
  ) {
    return {
      bg: 'bg-amber-700/90',
      text: 'text-white',
      border: 'ring-amber-900/60'
    }
  }
  if (
    color.includes('grey') ||
    color.includes('gray') ||
    color.includes('silver')
  ) {
    return {
      bg: 'bg-gray-400/90',
      text: 'text-gray-900',
      border: 'ring-gray-900/50'
    }
  }
  if (
    color.includes('marbled') ||
    color.includes('marble') ||
    color.includes('splatter') ||
    color.includes('swirl') ||
    color.includes('mixed')
  ) {
    return {
      bg: 'bg-gradient-to-br from-purple-500/90 to-pink-500/90',
      text: 'text-white',
      border: 'ring-purple-700/60'
    }
  }
  if (color.includes('opaque')) {
    // Opaque often comes with another color, but if standalone use a neutral color
    return {
      bg: 'bg-slate-600/90',
      text: 'text-white',
      border: 'ring-slate-800/60'
    }
  }

  // Default for unknown colors
  return { bg: 'bg-black/70', text: 'text-white', border: 'ring-white/30' }
}

function extractVinylInfo(
  formats: { name: string; text?: string }[]
): VinylInfo {
  const info: VinylInfo = {}

  // Common pressing plants and irrelevant terms to filter out
  const irrelevantTerms = [
    'pressing',
    'records',
    'vinyl',
    'edition',
    'reissue',
    'remastered',
    'company',
    'plant',
    'united',
    'optimal',
    'pallas',
    'gz',
    'rainbo',
    'gatefold',
    'sleeve',
    'jacket'
  ]

  for (const format of formats) {
    if (format.name === 'Vinyl' && format.text) {
      const parts = format.text.split(',').map((p) => p.trim())

      for (const part of parts) {
        const lower = part.toLowerCase()

        // Check if this is an irrelevant term
        const isIrrelevant = irrelevantTerms.some((term) =>
          lower.includes(term)
        )
        if (isIrrelevant) continue

        // Extract weight (e.g., "180g", "140 Gram")
        if (/\d+\s*g(ram)?/i.test(part)) {
          info.weight = part
          continue
        }

        // If it's not irrelevant and not a weight, assume it's a color
        // Colors typically come first or are descriptive terms
        if (!info.color && part.length > 0) {
          info.color = part
        }
      }
    }
  }

  return info
}

export function VinylCard({ release, className }: VinylCardProps) {
  const { basic_information: info } = release
  const artistName = info.artists.map((a) => a.name).join(', ')
  const coverImage = info.cover_image || info.thumb
  const year = info.year > 0 ? info.year : null
  const genreList =
    info.genres && info.genres.length > 0
      ? (() => {
          const parts = info.genres
            .flatMap((genre) => genre.split(',').map((part) => part.trim()))
            .filter(Boolean)
          const limited = parts.slice(0, 2)
          if (limited.length === 2) return `${limited[0]} & ${limited[1]}`
          return limited.join(', ')
        })()
      : null
  const metaLine = [year ? String(year) : null, genreList]
    .filter(Boolean)
    .join(' · ')
  const vinylInfo = extractVinylInfo(info.formats)
  const colorStyles = vinylInfo.color ? getColorStyles(vinylInfo.color) : null

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-border/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:ring-border/60',
        className
      )}
    >
      {/* Cover Art */}
      <div className="relative z-0 aspect-square overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${artistName} - ${info.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <Disc3 className="h-20 w-20 text-muted-foreground opacity-30" />
          </div>
        )}

        {/* Vinyl Info Badges */}
        {(vinylInfo.color || vinylInfo.weight) && (
          <div className="absolute right-2 top-2 flex flex-col gap-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
            {/* Color Badge with actual color */}
            {vinylInfo.color && colorStyles && (
              <div
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-lg ring-1 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.03]',
                  colorStyles.bg,
                  colorStyles.text,
                  colorStyles.border
                )}
              >
                <Disc3 className="h-3 w-3" />
                {vinylInfo.color}
              </div>
            )}
            {/* Weight Badge */}
            {vinylInfo.weight && (
              <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-sm ring-1 ring-white/30 transition-transform duration-300 group-hover:scale-[1.03]">
                {vinylInfo.weight}
              </div>
            )}
          </div>
        )}
        {/* Hover Overlay with Details */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="translate-y-2 transition-transform duration-300 group-hover:translate-y-0">
            <h3
              className="line-clamp-2 text-base font-semibold text-white"
              title={info.title}
            >
              {info.title}
            </h3>
            <p
              className="mt-1 line-clamp-1 text-sm text-gray-200"
              title={artistName}
            >
              {artistName}
            </p>
            {metaLine && (
              <div className="mt-2 text-xs text-gray-300">
                <span className="line-clamp-1">{metaLine}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Info Below (always visible) */}
      <div className="relative z-20 -mt-px bg-card p-3">
        <h3
          className="truncate text-sm font-medium leading-tight"
          title={info.title}
        >
          {info.title}
        </h3>
        <p
          className="mt-0.5 truncate text-xs text-muted-foreground"
          title={artistName}
        >
          {artistName}
        </p>
      </div>
    </div>
  )
}
