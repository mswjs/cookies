/**
 * @jest-environment node
 */
import { store } from '../src'

afterEach(() => {
  store.clear()
})

it('stores a given request cookies', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)

  // Assert cookie entry has been created by request's origin.
  const allCookies = store.getAll()
  const allCookiesList = Array.from(allCookies.entries())
  expect(allCookiesList).toHaveLength(1)
  expect(allCookiesList[0][0]).toEqual('https://mswjs.io')
  expect(Array.from(allCookiesList[0][1].entries())).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
  ])

  // Assert the cookie can be retrieved given a matching request.
  const reqCookies = store.get(req)
  expect(Array.from(reqCookies.entries())).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
  ])
})

it('accumulates multiple cookies of the same request', () => {
  const req = new Request('https://mswjs.io')
  const firstRes = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })
  const secondRes = new Response(null, {
    headers: new Headers({ 'set-cookie': 'secondCookie=def-456' }),
  })

  store.add(req, firstRes)
  store.add(req, secondRes)

  const reqCookies = store.get(req)
  expect(Array.from(reqCookies.entries())).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
    ['secondCookie', { name: 'secondCookie', value: 'def-456' }],
  ])
})

it('returns an empty Map when given a non-matching request', () => {
  const req = new Request('https://mswjs.io')
  const extraneousReq = new Request('https://mdn.com')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })
  store.add(req, res)

  const reqCookies = store.get(extraneousReq)
  expect(reqCookies.size).toBe(0)
})

it('deletes all cookies by a given request', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })
  store.add(req, res)

  const mdnReq = new Request('https://mdn.com')
  store.add(mdnReq, res)
  store.deleteAll(req)

  // Deletes only the cookies by a given request.
  const reqCookies = store.get(req)
  expect(reqCookies.size).toBe(0)

  // Leaves the cookies of other requests intact.
  const mdnReqCookies = store.get(mdnReq)
  expect(mdnReqCookies.size).toBe(1)
})

it('clears the entire cookie store', () => {
  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })
  store.add(req, res)
  store.clear()

  expect(store.getAll().size).toBe(0)
})
