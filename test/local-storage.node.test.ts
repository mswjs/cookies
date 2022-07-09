/**
 * @jest-environment node
 */
import { Store, store } from '../src'

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
