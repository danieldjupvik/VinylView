/**
 * Discogs API Helpers
 *
 * Pure utility functions for working with Discogs data.
 * All API calls are handled by the tRPC server (src/server/trpc/routers/discogs.ts).
 */

/**
 * Determines whether a Discogs release includes a vinyl format.
 *
 * @param formats - Array of format objects from a Discogs release; each object must have a `name` property
 * @returns `true` if any format has `name` equal to `"Vinyl"`, `false` otherwise.
 * @example
 * isVinylRecord([{ name: 'CD' }, { name: 'Vinyl' }]) // true
 */
export function isVinylRecord(formats: { name: string }[]): boolean {
  return formats.some((format) => format.name === 'Vinyl')
}