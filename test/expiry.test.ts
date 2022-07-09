/**
 * @jest-environment jsdom
 */
import { store } from '../src'

afterEach(() => {
  store.clear()
})

it('does not add expired cookies', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({
      'set-cookie': `cookieName=abc-123; Expires=${new Date().toUTCString()}`,
    }),
  })

  store.add(req, res)

  // Assert cookie entry has not been added.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})

it('does not add cookies with a max age of zero', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123; Max-Age=0' }),
  })

  store.add(req, res)

  // Assert cookie entry has not been added.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})

it('does not return expired cookies', async () => {
  const req = new Request('https://mswjs.io')
  const date = new Date()
  date.setSeconds(date.getSeconds() + 2)
  const res = new Response(null, {
    headers: new Headers({
      'set-cookie': `cookieName=abc-123; Expires=${date.toUTCString()}`,
    }),
  })

  store.add(req, res)

  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Assert cookie entry has been deleted.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})

it('does not return cookies after the max age', async () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123; Max-Age=1' }),
  })

  store.add(req, res)

  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Assert cookie entry has been deleted.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})

it('returns cookies before they expire', async () => {
  const req = new Request('https://mswjs.io')
  const date = new Date()
  date.setSeconds(date.getSeconds() + 2)
  const res = new Response(null, {
    headers: new Headers({
      'set-cookie': `cookieName=abc-123; Expires=${date.toUTCString()}`,
    }),
  })

  store.add(req, res)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Assert cookie entry has been created by request's origin.
  const allCookies = store.getAll()
  const allCookiesList = Array.from(allCookies.entries())
  expect(allCookiesList).toHaveLength(1)
  expect(allCookiesList[0][0]).toEqual('https://mswjs.io')
  expect(Array.from(allCookiesList[0][1].entries())).toEqual([
    [
      'cookieName',
      {
        expires: new Date(date.toUTCString()),
        name: 'cookieName',
        value: 'abc-123',
      },
    ],
  ])

  // Assert the cookie can be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(Array.from(reqCookies.entries())).toEqual([
    [
      'cookieName',
      {
        expires: new Date(date.toUTCString()),
        name: 'cookieName',
        value: 'abc-123',
      },
    ],
  ])
})

it('returns cookies before the max age', async () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123; Max-Age=2' }),
  })

  store.add(req, res)

  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Assert cookie entry has been created by request's origin.
  const allCookies = store.getAll()
  const allCookiesList = Array.from(allCookies.entries())
  expect(allCookiesList).toHaveLength(1)
  expect(allCookiesList[0][0]).toEqual('https://mswjs.io')
  const expires = allCookiesList[0][1].get('cookieName')?.expires
  expect(expires?.getTime()).toBeGreaterThan(Date.now())
  expect(Array.from(allCookiesList[0][1].entries())).toEqual([
    [
      'cookieName',
      { expires, name: 'cookieName', maxAge: 2, value: 'abc-123' },
    ],
  ])

  // Assert the cookie can be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(Array.from(reqCookies.entries())).toEqual([
    [
      'cookieName',
      { expires, name: 'cookieName', maxAge: 2, value: 'abc-123' },
    ],
  ])
})

it('deletes an existing cookie when setting a cookie with the same name and expiration date in the past', () => {
  const req = new Request('https://mswjs.io')

  store.add(
    req,
    new Response(null, {
      headers: new Headers({ 'set-cookie': `cookieName=abc-123 }` }),
    }),
  )

  const date = new Date()
  date.setSeconds(date.getSeconds() - 2)
  const res = new Response(null, {
    headers: new Headers({
      'set-cookie': `cookieName=abc-123; Expires=${date.toUTCString()}`,
    }),
  })

  store.add(req, res)

  // Assert cookie entry has been deleted.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})

it('deletes an existing cookie when setting a cookie with the same name and a max age of 0', () => {
  const req = new Request('https://mswjs.io')

  store.add(
    req,
    new Response(null, {
      headers: new Headers({ 'set-cookie': `cookieName=abc-123 }` }),
    }),
  )

  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123; Max-Age=0' }),
  })

  store.add(req, res)

  // Assert cookie entry has been deleted.
  const allCookies = store.getAll()
  expect(allCookies.size).toBe(0)

  // Assert the cookie can't be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)
})
