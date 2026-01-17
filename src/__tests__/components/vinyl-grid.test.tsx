import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { VinylGrid } from '@/components/collection/vinyl-grid'
import type { DiscogsCollectionRelease } from '@/types/discogs'

const releases: DiscogsCollectionRelease[] = [
  {
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
  },
  {
    id: 2,
    instance_id: 102,
    date_added: '2024-01-10T14:20:00-08:00',
    rating: 0,
    basic_information: {
      id: 2,
      title: 'Another Album',
      year: 2019,
      resource_url: 'https://api.discogs.com/releases/2',
      thumb: 'https://i.discogs.com/thumb2.jpg',
      cover_image: 'https://i.discogs.com/cover2.jpg',
      formats: [{ name: 'Vinyl', qty: '1' }],
      labels: [{ name: 'Another Label', catno: 'AL002' }],
      artists: [{ name: 'Another Artist', id: 2 }],
      genres: ['Electronic'],
      styles: ['Ambient']
    }
  }
]

describe('VinylGrid', () => {
  it('renders skeletons while loading', () => {
    const { container } = render(<VinylGrid releases={[]} isLoading={true} />)

    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(10)
  })

  it('renders release cards once loaded', () => {
    render(<VinylGrid releases={releases} isLoading={false} />)

    expect(
      screen.getByRole('img', { name: 'Test Artist - Test Album' })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Another Artist - Another Album' })
    ).toBeInTheDocument()
  })
})
