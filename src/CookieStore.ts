import { Cookie, parse as parseCookie } from 'set-cookie-parser'

interface RequestLike {
    credentials: Request['credentials'];
    url: string;
}
interface HeadersLike {
    get(name: string): string | null;
}
interface ResponseLike {
    headers: HeadersLike;
}
type Store = Map<string, StoreEntry>
type StoreEntry = Map<string, Cookie>

export const PERSISTENCY_KEY = 'MSW_COOKIE_STORE'

class CookieStore {
  private store: Store
  private supportsPersistency: boolean

  constructor() {
    this.store = new Map()
    this.supportsPersistency = typeof window !== 'undefined'
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

    const parsedResponseCookies = parseCookie(responseCookies)

    const prevCookies =
      this.store.get(requestUrl.origin) || (new Map() as StoreEntry)

    parsedResponseCookies.forEach((cookie) => {
      this.store.set(requestUrl.origin, prevCookies.set(cookie.name, cookie))
    })
  }

  /**
   * Returns cookies relevant to the given request
   * and its `request.credentials` policy.
   */
  get(request: RequestLike): StoreEntry {
    const requestUrl = new URL(request.url)
    const originCookies = this.store.get(requestUrl.origin) || new Map()

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
   * Hydrates the virtual cookie store from the `localStorage`.
   */
  hydrate(): void {
    if (!this.supportsPersistency) {
      return
    }

    const persistedCookies = localStorage.getItem(PERSISTENCY_KEY)

    if (persistedCookies) {
      const parsedCookies: [string, [string, any]] = JSON.parse(
        persistedCookies
      )

      parsedCookies.forEach(([origin, cookie]) => {
        this.store.set(origin, new Map(cookie))
      })
    }
  }

  /**
   * Persists the current virtual cookies into the `localStorage`,
   * so they are available on the next page load.
   */
  persist(): void {
    if (!this.supportsPersistency) {
      return
    }

    const serializedCookies = Array.from(this.store.entries()).map(
      ([origin, cookies]) => {
        return [origin, Array.from(cookies.entries())]
      }
    )

    localStorage.setItem(PERSISTENCY_KEY, JSON.stringify(serializedCookies))
  }
}

export default new CookieStore()
