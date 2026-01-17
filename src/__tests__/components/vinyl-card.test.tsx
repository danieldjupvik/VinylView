import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VinylCard } from '@/components/collection/vinyl-card'
import type { DiscogsCollectionRelease } from '@/types/discogs'

const release: DiscogsCollectionRelease = {
  id: 1,
  instance_id: 101,
  date_added: '2024-01-15T10:30:00-08:00',
  rating: 0,
  basic_information: {
    id: 1,
    title: 'Test Album',
    year: 2020,
    resource_url: 'https://api.discogs.com/releases/1',
    thumb: 'https://i.discogs.com/thumb1.jpg',
    cover_image: 'https://i.discogs.com/cover1.jpg',
    formats: [{ name: 'Vinyl', qty: '1' }],
    labels: [{ name: 'Test Label', catno: 'TL001' }],
    artists: [{ name: 'Test Artist', id: 1 }],
    genres: ['Rock'],
    styles: ['Indie Rock']
  }
}

describe('VinylCard', () => {
  it('renders cover art, title, and artist', () => {
    render(<VinylCard release={release} />)

    expect(screen.getAllByText('Test Album')).not.toHaveLength(0)
    expect(screen.getAllByText('Test Artist')).not.toHaveLength(0)
    expect(
      screen.getByRole('img', { name: 'Test Artist - Test Album' })
    ).toBeInTheDocument()
  })

  it('renders fallback when cover art is missing', () => {
    const noCover: DiscogsCollectionRelease = {
      ...release,
      basic_information: {
        ...release.basic_information,
        cover_image: '',
        thumb: ''
      }
    }

    render(<VinylCard release={noCover} />)

    expect(screen.getAllByText('Test Album')).not.toHaveLength(0)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
