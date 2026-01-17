import { describe, expect, it } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { useCollection } from '@/hooks/use-collection'
import { AuthContext, type AuthContextValue } from '@/providers/auth-context'
import { server } from '@/__tests__/mocks/server'

const buildRelease = ({
  id,
  instanceId,
  title,
  artist,
  genres,
  formats
}: {
  id: number
  instanceId: number
  title: string
  artist: string
  genres: string[]
  formats: { name: string; qty: string }[]
}) => ({
  id,
  instance_id: instanceId,
  date_added: '2024-01-10T14:20:00-08:00',
  basic_information: {
    id,
    title,
    year: 2020,
    resource_url: `https://api.discogs.com/releases/${id}`,
    thumb: `https://i.discogs.com/thumb${id}.jpg`,
    cover_image: `https://i.discogs.com/cover${id}.jpg`,
    formats,
    labels: [{ name: 'Test Label', catno: 'TL001' }],
    artists: [{ name: artist, id }],
    genres,
    styles: []
  }
})

const createWrapper = (username = 'testuser') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  const authValue: AuthContextValue = {
    isAuthenticated: true,
    isLoading: false,
    username,
    userId: 123,
    avatarUrl: null,
    login: async () => {},
    logout: () => {}
  }

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    </QueryClientProvider>
  )
}

describe('useCollection', () => {
  it('fetches collection releases', async () => {
    const { result } = renderHook(() => useCollection({ page: 1 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.releases).toHaveLength(2)
    expect(result.current.vinylOnly).toHaveLength(2)
  })

  it('filters releases by search query', async () => {
    const { result } = renderHook(() => useCollection({ page: 1 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setSearch('another')
    })

    await waitFor(() =>
      expect(result.current.filteredReleases.length).toBeGreaterThan(0)
    )
    expect(
      result.current.filteredReleases.every((release) =>
        release.basic_information.title.toLowerCase().includes('another')
      )
    ).toBe(true)
  })

  it('counts non-vinyl releases separately', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/folders/0/releases',
        () =>
          HttpResponse.json({
            pagination: { page: 1, pages: 1, per_page: 100, items: 2 },
            releases: [
              {
                id: 1,
                instance_id: 101,
                date_added: '2024-01-15T10:30:00-08:00',
                basic_information: {
                  id: 1,
                  title: 'Vinyl Album',
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
                basic_information: {
                  id: 2,
                  title: 'CD Album',
                  year: 2019,
                  resource_url: 'https://api.discogs.com/releases/2',
                  thumb: 'https://i.discogs.com/thumb2.jpg',
                  cover_image: 'https://i.discogs.com/cover2.jpg',
                  formats: [{ name: 'CD', qty: '1' }],
                  labels: [{ name: 'Another Label', catno: 'AL002' }],
                  artists: [{ name: 'Another Artist', id: 2 }],
                  genres: ['Electronic'],
                  styles: ['Ambient']
                }
              }
            ]
          })
      )
    )

    const { result } = renderHook(() => useCollection({ page: 1 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.vinylOnly).toHaveLength(1)
    expect(result.current.nonVinylCount).toBe(1)
    expect(result.current.nonVinylBreakdown[0].format).toBe('CD')
  })

  it('paginates client-side when search is active', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/folders/0/releases',
        ({ request }) => {
          const url = new URL(request.url)
          const page = Number(url.searchParams.get('page') ?? '1')
          const perPage = 2

          const releases =
            page === 1
              ? [
                  buildRelease({
                    id: 1,
                    instanceId: 101,
                    title: 'Alpha Album',
                    artist: 'Alpha Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  }),
                  buildRelease({
                    id: 2,
                    instanceId: 102,
                    title: 'Beta Album',
                    artist: 'Beta Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  })
                ]
              : [
                  buildRelease({
                    id: 3,
                    instanceId: 103,
                    title: 'Gamma Album',
                    artist: 'Gamma Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  }),
                  buildRelease({
                    id: 4,
                    instanceId: 104,
                    title: 'Delta Album',
                    artist: 'Delta Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  })
                ]

          return HttpResponse.json({
            pagination: { page, pages: 2, per_page: perPage, items: 4 },
            releases
          })
        }
      )
    )

    const { result } = renderHook(() => useCollection({ page: 2 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setSearch('album')
    })

    await waitFor(() => expect(result.current.pagination?.pages).toBe(2))
    expect(result.current.filteredReleases).toHaveLength(2)
    expect(result.current.filteredReleases[0].basic_information.title).toBe(
      'Gamma Album'
    )
    expect(result.current.filteredReleases[1].basic_information.title).toBe(
      'Delta Album'
    )
  })

  it('filters genres across pages and updates totals', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/folders/0/releases',
        ({ request }) => {
          const url = new URL(request.url)
          const page = Number(url.searchParams.get('page') ?? '1')
          const perPage = 2

          const releases =
            page === 1
              ? [
                  buildRelease({
                    id: 10,
                    instanceId: 110,
                    title: 'Rock One',
                    artist: 'Rock Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  }),
                  buildRelease({
                    id: 11,
                    instanceId: 111,
                    title: 'Jazz One',
                    artist: 'Jazz Artist',
                    genres: ['Jazz'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  })
                ]
              : [
                  buildRelease({
                    id: 12,
                    instanceId: 112,
                    title: 'Rock Two',
                    artist: 'Rock Artist',
                    genres: ['Rock'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  }),
                  buildRelease({
                    id: 13,
                    instanceId: 113,
                    title: 'Electronic One',
                    artist: 'Electronic Artist',
                    genres: ['Electronic'],
                    formats: [{ name: 'Vinyl', qty: '1' }]
                  })
                ]

          return HttpResponse.json({
            pagination: { page, pages: 2, per_page: perPage, items: 4 },
            releases
          })
        }
      )
    )

    const { result } = renderHook(() => useCollection({ page: 1 }), {
      wrapper: createWrapper()
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    act(() => {
      result.current.setSelectedGenres(['Rock'])
    })

    await waitFor(() => expect(result.current.pagination?.total).toBe(2))
    expect(result.current.filteredReleases).toHaveLength(2)
    expect(
      result.current.filteredReleases.every((release) =>
        release.basic_information.genres?.includes('Rock')
      )
    ).toBe(true)
  })

  it('sorts by genre in ascending order', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/folders/0/releases',
        () =>
          HttpResponse.json({
            pagination: { page: 1, pages: 1, per_page: 100, items: 3 },
            releases: [
              buildRelease({
                id: 20,
                instanceId: 120,
                title: 'Zeta Album',
                artist: 'Zeta Artist',
                genres: ['Rock'],
                formats: [{ name: 'Vinyl', qty: '1' }]
              }),
              buildRelease({
                id: 21,
                instanceId: 121,
                title: 'Alpha Album',
                artist: 'Alpha Artist',
                genres: ['Ambient'],
                formats: [{ name: 'Vinyl', qty: '1' }]
              }),
              buildRelease({
                id: 22,
                instanceId: 122,
                title: 'Beta Album',
                artist: 'Beta Artist',
                genres: ['Electronic'],
                formats: [{ name: 'Vinyl', qty: '1' }]
              })
            ]
          })
      )
    )

    const { result } = renderHook(
      () => useCollection({ page: 1, sort: 'genre', sortOrder: 'asc' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const titles = result.current.filteredReleases.map(
      (release) => release.basic_information.title
    )
    expect(titles).toEqual(['Alpha Album', 'Beta Album', 'Zeta Album'])
  })
})
