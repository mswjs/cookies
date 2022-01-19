import { Store, store } from '../src'

const originalLocalStorage: Storage = localStorage

beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: undefined,
    writable: true,
  })
})

afterAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: originalLocalStorage,
  })
})

it('adds response cookies to the store even if "localStorage" is unavailable', () => {
  store.add(
    new Request('https://example.com'),
    new Response(null, {
      headers: new Headers({
        'Set-Cookie': 'cookieName=abc-123',
      }),
    }),
  )
  store.persist()

  expect(store.getAll()).toEqual<Store>(
    new Map([
      [
        'https://example.com',
        new Map([
          [
            'cookieName',
            {
              name: 'cookieName',
              value: 'abc-123',
            },
          ],
        ]),
      ],
    ]),
  )
})
