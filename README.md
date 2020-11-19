[![Latest version](https://img.shields.io/npm/v/virtual-cookies.svg)](https://www.npmjs.com/package/virtual-cookies)

# Cookie Store

Virtual cookie store to manage request/response cookies associations in a unique collection.

## API

### `set(req: Request, res: Response)`

Sets the response cookies in the store associated with the given request origin.

```js
store.set(
  new Request('https://mswjs.io'),
  new Response(null, {
    headers: new Headers({
      'set-cookie': 'id=abc-123',
    }),
  })
)
```

### `get(req: Request)`

Retrieves the cookies relevant to the given request's origin.

```js
store.get(new Request('https://mswjs.io'))
```

> `.get()` respects the `req.credentials` policy.

### `getAll()`

Returns all the cookies in the store.

### `deleteAll(req: Request)`

Removes all the cookies associated with the given request's origin.

### `persist()`

Persists the current store state in the `localStorage`.

### `hydrate()`

Hydrates the store values from the previously persisted state in `localStorage`.

### `clear()`

Removes all the cookies from the store, producing a nice and shiny empty store.

## Credits

Original idea by [
Christoph Guttandin](https://github.com/chrisguttandin).
