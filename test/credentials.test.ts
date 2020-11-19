import { store } from '../src'

afterEach(() => {
  document.cookie = ''
  store.clear()
})

test('includes only cookies with the matching origin given no "credentials"', () => {
  // Emulate document cookies set by another response.
  document.cookie = 'mdn=true'

  const req = new Request('https://mswjs.io')
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)
  const reqCookies = store.get(req)

  expect(Array.from(reqCookies)).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
  ])
})

test('includes only cookies with the matching origin given "credentials: same-origin"', () => {
  // Emulate document cookies set by another response.
  document.cookie = 'mdn=true'

  const req = new Request('https://mswjs.io', { credentials: 'same-origin' })
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)
  const reqCookies = store.get(req)

  expect(Array.from(reqCookies)).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
  ])
})

test('includes all cookies given "credentials: include"', () => {
  // Emulate document cookies set by another response.
  document.cookie = 'mdn=true'

  const req = new Request('https://mswjs.io', { credentials: 'include' })
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)
  const reqCookies = store.get(req)

  expect(Array.from(reqCookies)).toEqual([
    ['cookieName', { name: 'cookieName', value: 'abc-123' }],
    ['mdn', { name: 'mdn', value: 'true' }],
  ])
})

test('returns an empty Map given "credentials: omit"', () => {
  // Emulate document cookies set by another response.
  document.cookie = 'mdn=true'

  const req = new Request('https://mswjs.io', { credentials: 'omit' })
  const res = new Response(null, {
    headers: new Headers({ 'set-cookie': 'cookieName=abc-123' }),
  })

  store.add(req, res)
  const reqCookies = store.get(req)

  expect(reqCookies.size).toBe(0)
})
