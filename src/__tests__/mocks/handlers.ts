import { http, HttpResponse } from 'msw'

export const handlers = [
  // Identity endpoint
  http.get('https://api.discogs.com/oauth/identity', ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (auth === 'Discogs token=valid-token') {
      return HttpResponse.json({
        username: 'testuser',
        id: 123,
        resource_url: 'https://api.discogs.com/users/testuser'
      })
    }
    return new HttpResponse(null, { status: 401 })
  }),

  // Collection endpoint
  http.get(
    'https://api.discogs.com/users/:username/collection/folders/0/releases',
    ({ request }) => {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const perPage = parseInt(url.searchParams.get('per_page') || '100')

      return HttpResponse.json(
        {
          pagination: {
            page,
            pages: 2,
            per_page: perPage,
            items: 150,
            urls: {
              next:
                page < 2
                  ? `https://api.discogs.com/users/testuser/collection/folders/0/releases?page=${page + 1}`
                  : undefined,
              prev:
                page > 1
                  ? `https://api.discogs.com/users/testuser/collection/folders/0/releases?page=${page - 1}`
                  : undefined
            }
          },
          releases: [
            {
              id: 1,
              instance_id: 101,
              date_added: '2024-01-15T10:30:00-08:00',
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
              basic_information: {
                id: 2,
                title: 'Another Album',
                year: 2019,
                resource_url: 'https://api.discogs.com/releases/2',
                thumb: 'https://i.discogs.com/thumb2.jpg',
                cover_image: 'https://i.discogs.com/cover2.jpg',
                formats: [{ name: 'Vinyl', qty: '2' }],
                labels: [{ name: 'Another Label', catno: 'AL002' }],
                artists: [{ name: 'Another Artist', id: 2 }],
                genres: ['Electronic'],
                styles: ['Ambient']
              }
            }
          ]
        },
        {
          headers: {
            'X-Discogs-Ratelimit': '60',
            'X-Discogs-Ratelimit-Used': '5',
            'X-Discogs-Ratelimit-Remaining': '55'
          }
        }
      )
    }
  )
]
