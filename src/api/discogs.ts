/**
 * Discogs API Helpers
 *
 * Pure utility functions for working with Discogs data.
 * All API calls are handled by the tRPC server (src/server/trpc/routers/discogs.ts).
 */

/**
 * Check if a release is a vinyl record based on its formats.
 *
 * @param formats - Array of format objects from a Discogs release
 * @returns True if any format is named "Vinyl"
 */
export function isVinylRecord(formats: { name: string }[]): boolean {
  return formats.some((format) => format.name === 'Vinyl')
}
