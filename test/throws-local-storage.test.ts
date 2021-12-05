const originalLocalStorage: Storage = localStorage
Object.defineProperty(window, 'localStorage', {
  get: () => {
    throw Error(`Cannot read properties of null (reading '_origin')`)
  },
})

import { store } from '../src'

describe('when `localStorage` is throwing error', () => {
  afterEach(() => {
    store.clear()
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
  })
})
