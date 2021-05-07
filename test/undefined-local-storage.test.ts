const originalLocalStorage: Storage = localStorage
Object.defineProperty(window, 'localStorage', {
  value: undefined,
  writable: true,
})

import { store, PERSISTENCY_KEY } from '../src'

describe('when `localStorage` is undefined', () => {
  afterEach(() => {
    store.clear()
  })

  afterAll(() => {
    localStorage = originalLocalStorage
  })

  test('persists in the internal store only', () => {
    const req = new Request('https://mswjs.io')
    const res = new Response(null, {
      headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
    })

    store.add(req, res)
    store.persist()

    expect(store.getAll()).toEqual(
      new Map([
        [
          'https://mswjs.io',
          new Map([['cookieName', { name: 'cookieName', value: 'abc-123' }]]),
        ],
      ]),
    )

    localStorage = originalLocalStorage
    expect(localStorage.getItem(PERSISTENCY_KEY)).toEqual(null)
  })
})
