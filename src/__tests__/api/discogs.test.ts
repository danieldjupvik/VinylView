import { describe, expect, it } from 'vitest'

import { isVinylRecord } from '@/api/discogs'

describe('discogs utilities', () => {
  describe('isVinylRecord', () => {
    it('returns true for vinyl format', () => {
      expect(isVinylRecord([{ name: 'Vinyl' }])).toBe(true)
    })

    it('returns true when vinyl is among multiple formats', () => {
      expect(isVinylRecord([{ name: 'CD' }, { name: 'Vinyl' }])).toBe(true)
    })

    it('returns false for non-vinyl formats', () => {
      expect(isVinylRecord([{ name: 'CD' }])).toBe(false)
    })

    it('returns false for empty formats array', () => {
      expect(isVinylRecord([])).toBe(false)
    })

    it('returns false when only CD format', () => {
      expect(isVinylRecord([{ name: 'CD' }, { name: 'Cassette' }])).toBe(false)
    })
  })
})
