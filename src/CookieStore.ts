import { Cookie, parse as parseCookie } from 'set-cookie-parser'

interface RequestLike {
  credentials: Request['credentials']
  url: string
}

interface HeadersLike {
  get(name: string): string | null
}

interface ResponseLike {
  headers: HeadersLike
}

export type Store = Map<string, StoreEntry>
export type StoreEntry = Map<string, Cookie>
export type CookieString = Omit<Cookie, 'expires'> & { expires?: string }

export const PERSISTENCY_KEY = 'MSW_COOKIE_STORE'

function supportsLocalStorage() {
  try {
    if (localStorage == null) {
      return false
    }
    
    const testKey = PERSISTENCY_KEY + '_test'

    localStorage.setItem(testKey, 'test')
    localStorage.getItem(testKey)
    localStorage.removeItem(testKey)

    return true
  } catch (error) {
    return false
  }
}

class CookieStore {
  private store: Store

  constructor() {
    this.store = new Map()
  }

  /**
   * Sets the given request cookies into the store.
   * Respects the `request.credentials` policy.
   */
  add(request: RequestLike, response: ResponseLike): void {
    if (request.credentials === 'omit') {
      return
    }

    const requestUrl = new URL(request.url)
    const responseCookies = response.headers.get('set-cookie')

    if (!responseCookies) {
      return
    }

    const now = Date.now()
    const parsedResponseCookies = parseCookie(responseCookies).map(
      ({ maxAge, ...cookie }) => ({
        ...cookie,
        expires:
          maxAge === undefined ? cookie.expires : new Date(now + maxAge * 1000),
        maxAge,
      }),
    )

    const prevCookies =
      this.store.get(requestUrl.origin) || new Map<string, Cookie>()

    parsedResponseCookies.forEach((cookie) => {
      this.store.set(requestUrl.origin, prevCookies.set(cookie.name, cookie))
    })
  }

  /**
   * Returns cookies relevant to the given request
   * and its `request.credentials` policy.
   */
  get(request: RequestLike): StoreEntry {
    this.deleteExpiredCookies()

    const requestUrl = new URL(request.url)
    const originCookies =
      this.store.get(requestUrl.origin) || new Map<string, Cookie>()

    switch (request.credentials) {
      case 'include': {
        const documentCookies = parseCookie(document.cookie)

        documentCookies.forEach((cookie) => {
          originCookies.set(cookie.name, cookie)
        })

        return originCookies
      }

      case 'same-origin': {
        return originCookies
      }

      default:
        return new Map()
    }
  }

  /**
   * Returns a collection of all stored cookies.
   */
  getAll(): Store {
    this.deleteExpiredCookies()
    return this.store
  }

  /**
   * Deletes all cookies associated with the given request.
   */
  deleteAll(request: RequestLike): void {
    const requestUrl = new URL(request.url)
    this.store.delete(requestUrl.origin)
  }

  /**
   * Clears the entire cookie store.
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Hydrates the virtual cookie store from the `localStorage` if defined.
   */
  hydrate(): void {
    if (!supportsLocalStorage()) {
      return
    }

    const persistedCookies = localStorage.getItem(PERSISTENCY_KEY)

    if (!persistedCookies) {
      return
    }

    try {
      const parsedCookies: [string, [string, CookieString][]][] =
        JSON.parse(persistedCookies)

      parsedCookies.forEach(([origin, cookies]) => {
        this.store.set(
          origin,
          new Map(
            cookies.map(([token, { expires, ...cookie }]) => [
              token,
              expires === undefined
                ? cookie
                : { ...cookie, expires: new Date(expires) },
            ]),
          ),
        )
      })
    } catch (error) {
      console.warn(`
[virtual-cookie] Failed to parse a stored cookie from the localStorage (key "${PERSISTENCY_KEY}").

Stored value:
${localStorage.getItem(PERSISTENCY_KEY)}

Thrown exception:
${error}

Invalid value has been removed from localStorage to prevent subsequent failed parsing attempts.`)
      localStorage.removeItem(PERSISTENCY_KEY)
    }
  }

  /**
   * Persists the current virtual cookies into the `localStorage` if defined,
   * so they are available on the next page load.
   */
  persist(): void {
    if (!supportsLocalStorage()) {
      return
    }

    const serializedCookies = Array.from(this.store.entries()).map(
      ([origin, cookies]) => {
        return [origin, Array.from(cookies.entries())]
      },
    )

    localStorage.setItem(PERSISTENCY_KEY, JSON.stringify(serializedCookies))
  }

  private deleteExpiredCookies() {
    const now = Date.now()

    this.store.forEach((originCookies, origin) => {
      originCookies.forEach(({ expires, name }) => {
        if (expires !== undefined && expires.getTime() <= now) {
          originCookies.delete(name)
        }
      })

      if (originCookies.size === 0) {
        this.store.delete(origin)
      }
    })
  }
}

export const store = new CookieStore()
