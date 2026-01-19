import { Disc3 } from 'lucide-react'
import { useState } from 'react'

import { getLimitedGenreParts } from '@/lib/formatters'
import { cn } from '@/lib/utils'
import type { DiscogsCollectionRelease } from '@/types/discogs'

interface VinylCardProps {
  release: DiscogsCollectionRelease
  className?: string
}

interface VinylInfo {
  color?: string
  weight?: string
}

const COLOR_STYLE_RULES: Array<{
  keywords: string[]
  styles: { bg: string; text: string; border: string }
}> = [
  {
    keywords: ['yellow', 'gold'],
    styles: {
      bg: 'bg-yellow-400/90',
      text: 'text-yellow-950',
      border: 'ring-yellow-900/50'
    }
  },
  {
    keywords: ['pink', 'magenta'],
    styles: {
      bg: 'bg-pink-500/90',
      text: 'text-white',
      border: 'ring-pink-700/60'
    }
  },
  {
    keywords: ['red'],
    styles: {
      bg: 'bg-red-500/90',
      text: 'text-white',
      border: 'ring-red-700/60'
    }
  },
  {
    keywords: ['blue', 'cyan'],
    styles: {
      bg: 'bg-blue-500/90',
      text: 'text-white',
      border: 'ring-blue-700/60'
    }
  },
  {
    keywords: ['green', 'lime'],
    styles: {
      bg: 'bg-green-500/90',
      text: 'text-white',
      border: 'ring-green-700/60'
    }
  },
  {
    keywords: ['purple', 'violet', 'lavender'],
    styles: {
      bg: 'bg-purple-500/90',
      text: 'text-white',
      border: 'ring-purple-700/60'
    }
  },
  {
    keywords: ['orange', 'amber'],
    styles: {
      bg: 'bg-orange-500/90',
      text: 'text-white',
      border: 'ring-orange-700/60'
    }
  },
  {
    keywords: ['white', 'clear', 'transparent', 'translucent'],
    styles: {
      bg: 'bg-white/95',
      text: 'text-gray-900',
      border: 'ring-gray-900/50'
    }
  },
  {
    keywords: ['smoke', 'smoky'],
    styles: {
      bg: 'bg-gray-500/90',
      text: 'text-white',
      border: 'ring-gray-700/60'
    }
  },
  {
    keywords: ['black'],
    styles: {
      bg: 'bg-gray-900/90',
      text: 'text-white',
      border: 'ring-gray-700/60'
    }
  },
  {
    keywords: ['brown', 'bronze', 'tan'],
    styles: {
      bg: 'bg-amber-700/90',
      text: 'text-white',
      border: 'ring-amber-900/60'
    }
  },
  {
    keywords: ['grey', 'gray', 'silver'],
    styles: {
      bg: 'bg-gray-400/90',
      text: 'text-gray-900',
      border: 'ring-gray-900/50'
    }
  },
  {
    keywords: ['marbled', 'marble', 'splatter', 'swirl', 'mixed'],
    styles: {
      bg: 'bg-gradient-to-br from-purple-500/90 to-pink-500/90',
      text: 'text-white',
      border: 'ring-purple-700/60'
    }
  },
  {
    keywords: ['opaque'],
    styles: {
      bg: 'bg-slate-600/90',
      text: 'text-white',
      border: 'ring-slate-800/60'
    }
  }
]

const DEFAULT_COLOR_STYLE = {
  bg: 'bg-black/70',
  text: 'text-white',
  border: 'ring-white/30'
}

const IRRELEVANT_VINYL_TERMS = [
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

function getColorStyles(colorName: string) {
  const color = colorName.toLowerCase()
  const matchedRule = COLOR_STYLE_RULES.find((rule) =>
    rule.keywords.some((keyword) => color.includes(keyword))
  )
  return matchedRule?.styles ?? DEFAULT_COLOR_STYLE
}

function extractVinylInfo(
  formats: { name: string; text?: string }[]
): VinylInfo {
  const info: VinylInfo = {}
  const colorCandidates: string[] = []

  for (const format of formats) {
    if (format.name === 'Vinyl' && format.text) {
      const parts = format.text.split(',').map((p) => p.trim())

      for (const part of parts) {
        const lower = part.toLowerCase()

        // Check if this is an irrelevant term
        const isIrrelevant = IRRELEVANT_VINYL_TERMS.some((term) =>
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
        if (part.length > 0) {
          colorCandidates.push(part)
        }
      }
    }
  }

  if (colorCandidates.length > 0) {
    const matchedColor =
      colorCandidates.find(
        (candidate) => getColorStyles(candidate) !== DEFAULT_COLOR_STYLE
      ) ?? colorCandidates[0]
    if (matchedColor) {
      info.color = matchedColor
    }
  }

  return info
}

export function VinylCard({ release, className }: VinylCardProps) {
  const [imageErrored, setImageErrored] = useState(false)
  const { basic_information: info } = release
  const artistName = info.artists.map((a) => a.name).join(', ')
  const coverImage = info.cover_image || info.thumb
  const showCoverImage = Boolean(coverImage) && !imageErrored
  const year = info.year > 0 ? info.year : null
  const genreParts =
    info.genres && info.genres.length > 0
      ? getLimitedGenreParts(info.genres)
      : []
  const genreList = (() => {
    if (genreParts.length === 2) {
      return `${genreParts[0]} & ${genreParts[1]}`
    }
    if (genreParts.length > 0) {
      return genreParts.join(', ')
    }
    return null
  })()
  const metaLine = [year ? String(year) : null, genreList]
    .filter(Boolean)
    .join(' · ')
  const vinylInfo = extractVinylInfo(info.formats)
  const colorStyles = vinylInfo.color ? getColorStyles(vinylInfo.color) : null

  return (
    <div
      className={cn(
        'group bg-card ring-border/40 hover:ring-border/60 relative cursor-pointer overflow-hidden rounded-xl shadow-sm ring-1 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl',
        className
      )}
    >
      {/* Cover Art */}
      <div className="relative z-0 aspect-square overflow-hidden">
        {showCoverImage ? (
          <img
            src={coverImage}
            alt={`${artistName} - ${info.title}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            loading="lazy"
            onError={() => setImageErrored(true)}
          />
        ) : (
          <div className="bg-muted flex h-full w-full items-center justify-center">
            <Disc3 className="text-muted-foreground h-20 w-20 opacity-30" />
          </div>
        )}

        {/* Vinyl Info Badges */}
        {vinylInfo.color || vinylInfo.weight ? (
          <div className="absolute top-2 right-2 flex flex-col gap-1.5 transition-transform duration-300 group-hover:-translate-y-0.5">
            {/* Color Badge with actual color */}
            {vinylInfo.color && colorStyles ? (
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
            ) : null}
            {/* Weight Badge */}
            {vinylInfo.weight ? (
              <div className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm transition-transform duration-300 group-hover:scale-[1.03]">
                {vinylInfo.weight}
              </div>
            ) : null}
          </div>
        ) : null}
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
            {metaLine ? (
              <div className="mt-2 text-xs text-gray-300">
                <span className="line-clamp-1">{metaLine}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Minimal Info Below (always visible) */}
      <div className="bg-card relative z-20 -mt-px p-3">
        <h3
          className="truncate text-sm leading-tight font-medium"
          title={info.title}
        >
          {info.title}
        </h3>
        <p
          className="text-muted-foreground mt-0.5 truncate text-xs"
          title={artistName}
        >
          {artistName}
        </p>
      </div>
    </div>
  )
}
