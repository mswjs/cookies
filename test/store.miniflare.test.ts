/**
 * @jest-environment miniflare
 * @jest-environment-options {"scriptPath": "src/index.ts"}
 */
import { store } from '../src'

afterEach(() => {
  store.clear()
})

it('stores cookies for the given request', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'Set-Cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)

  const allCookies = Array.from(store.getAll().entries())
  expect(allCookies).toEqual([
    [
      'https://mswjs.io',
      new Map([['cookieName', { name: 'cookieName', value: 'abc-123' }]]),
    ],
  ])
})

it('returns cookies for the requests with credentials "include"', () => {
  const req = new Request('https://mswjs.io', {
    credentials: 'include',
  })
  const res = new Response(null, {
    headers: new Headers({ 'Set-Cookie': 'secret=abc-123' }),
  })
  store.add(req, res)

  const cookies = store.get(req)
  expect(cookies).toEqual(
    new Map([
      [
        'secret',
        {
          name: 'secret',
          value: 'abc-123',
          maxAge: undefined,
          expires: undefined,
        },
      ],
    ]),
  )
})

it('returns cookies for the requests with credentials "same-origin"', () => {
  const req = new Request('https://mswjs.io', {
    credentials: 'same-origin',
  })
  const res = new Response(null, {
    headers: new Headers({ 'Set-Cookie': 'secret=abc-123' }),
  })

  store.add(req, res)
  store.add(
    {
      url: 'https://test.io',
      credentials: 'include',
    },
    new Response(null, {
      headers: new Headers({ 'Set-Cookie': 'anotherCookie=yes' }),
    }),
  )

  const cookies = store.get(req)
  expect(cookies).toEqual(
    new Map([['secret', { name: 'secret', value: 'abc-123' }]]),
  )
})

it('returns cookies for the requests with credentials "omit"', () => {
  const req = new Request('https://mswjs.io', {
    credentials: 'omit',
  })
  const res = new Response(null, {
    headers: new Headers({ 'Set-Cookie': 'secret=abc-123' }),
  })
  store.add(req, res)

  const cookies = store.get(req)
  expect(cookies).toEqual(
    new Map([['secret', { name: 'secret', value: 'abc-123' }]]),
  )
})
