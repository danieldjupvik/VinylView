import { describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import {
  getCollection,
  getIdentity,
  isVinylRecord,
  validateCredentials,
  getWantlist,
  getRelease,
  getMasterRelease,
  getCollectionValue
} from '@/api/discogs'
import { setToken } from '@/lib/storage'
import { server } from '@/__tests__/mocks/server'

describe('discogs api', () => {
  it('returns identity using stored token', async () => {
    setToken('valid-token')
    const identity = await getIdentity()

    expect(identity.username).toBe('testuser')
    expect(identity.id).toBe(123)
  })

  it('rejects invalid credentials', async () => {
    await expect(validateCredentials('bad-token')).rejects.toThrow()
  })

  it('passes collection params to the API', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/folders/3/releases',
        ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('page')).toBe('2')
          expect(url.searchParams.get('per_page')).toBe('50')
          expect(url.searchParams.get('sort')).toBe('artist')
          expect(url.searchParams.get('sort_order')).toBe('asc')

          return HttpResponse.json({
            pagination: {
              page: 2,
              pages: 2,
              per_page: 50,
              items: 50
            },
            releases: []
          })
        }
      )
    )

    const response = await getCollection('testuser', {
      page: 2,
      perPage: 50,
      folderId: 3,
      sort: 'artist',
      sortOrder: 'asc'
    })

    expect(response.pagination.page).toBe(2)
    expect(response.releases).toEqual([])
  })

  it('detects vinyl releases based on formats', () => {
    expect(isVinylRecord([{ name: 'Vinyl' }])).toBe(true)
    expect(isVinylRecord([{ name: 'CD' }])).toBe(false)
  })

  it('fetches wantlist with pagination params', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/wants',
        ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('page')).toBe('2')
          expect(url.searchParams.get('per_page')).toBe('25')

          return HttpResponse.json({
            pagination: {
              page: 2,
              pages: 3,
              per_page: 25,
              items: 75
            },
            wants: [
              {
                id: 1,
                basic_information: {
                  id: 1,
                  title: 'Wanted Album',
                  year: 2023,
                  formats: [{ name: 'Vinyl' }]
                }
              }
            ]
          })
        }
      )
    )

    const response = await getWantlist('testuser', { page: 2, perPage: 25 })

    expect(response.pagination.page).toBe(2)
    expect(response.wants).toHaveLength(1)
  })

  it('fetches wantlist with default params', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/wants',
        ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('page')).toBe('1')
          expect(url.searchParams.get('per_page')).toBe('100')

          return HttpResponse.json({
            pagination: { page: 1, pages: 1, per_page: 100, items: 10 },
            wants: []
          })
        }
      )
    )

    const response = await getWantlist('testuser')
    expect(response.pagination.page).toBe(1)
  })

  it('fetches release details by ID', async () => {
    server.use(
      http.get('https://api.discogs.com/releases/:releaseId', ({ params }) => {
        expect(params['releaseId']).toBe('12345')

        return HttpResponse.json({
          id: 12345,
          title: 'Test Release',
          artists: [{ name: 'Test Artist', id: 1 }],
          year: 2022,
          formats: [{ name: 'Vinyl', qty: '1' }],
          tracklist: []
        })
      })
    )

    const release = await getRelease(12345)

    expect(release.id).toBe(12345)
    expect(release.title).toBe('Test Release')
  })

  it('fetches release with currency parameter', async () => {
    server.use(
      http.get('https://api.discogs.com/releases/:releaseId', ({ request }) => {
        const url = new URL(request.url)
        expect(url.searchParams.get('curr_abbr')).toBe('EUR')

        return HttpResponse.json({
          id: 12345,
          title: 'Test Release',
          artists: [{ name: 'Test Artist', id: 1 }],
          year: 2022,
          formats: [{ name: 'Vinyl' }]
        })
      })
    )

    await getRelease(12345, 'EUR')
  })

  it('fetches master release by ID', async () => {
    server.use(
      http.get('https://api.discogs.com/masters/:masterId', ({ params }) => {
        expect(params['masterId']).toBe('67890')

        return HttpResponse.json({
          id: 67890,
          title: 'Master Release',
          main_release: 12345,
          artists: [{ name: 'Test Artist', id: 1 }],
          year: 2022,
          genres: ['Rock'],
          styles: ['Indie Rock']
        })
      })
    )

    const master = await getMasterRelease(67890)

    expect(master.id).toBe(67890)
    expect(master.title).toBe('Master Release')
    expect(master.main_release).toBe(12345)
  })

  it('fetches collection value for user', async () => {
    server.use(
      http.get(
        'https://api.discogs.com/users/:username/collection/value',
        ({ params }) => {
          expect(params['username']).toBe('testuser')

          return HttpResponse.json({
            maximum: '1500.00',
            median: '750.00',
            minimum: '250.00'
          })
        }
      )
    )

    const value = await getCollectionValue('testuser')

    expect(value.maximum).toBe('1500.00')
    expect(value.median).toBe('750.00')
    expect(value.minimum).toBe('250.00')
  })
})
