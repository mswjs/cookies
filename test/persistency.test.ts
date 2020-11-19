import { store, PERSISTENCY_KEY } from '../src'

afterEach(() => {
  store.clear()
})

test('hydrates cookies from localStorage', () => {
  localStorage.setItem(
    PERSISTENCY_KEY,
    JSON.stringify([
      [
        'https://mswjs.io',
        [['cookieName', { name: 'cookieName', value: 'abc-123' }]],
      ],
    ])
  )

  store.hydrate()
  const allCookies = store.getAll()

  expect(allCookies.size).toBe(1)

  const cookie = allCookies.get('https://mswjs.io')
  expect(cookie?.size).toBe(1)
  expect(cookie?.get('cookieName')).toEqual({
    name: 'cookieName',
    value: 'abc-123',
  })
})

test('persists cookies in localStorage', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)
  store.persist()

  expect(localStorage.getItem(PERSISTENCY_KEY)).toEqual(
    JSON.stringify([
      [
        'https://mswjs.io',
        [['cookieName', { name: 'cookieName', value: 'abc-123' }]],
      ],
    ])
  )
})
