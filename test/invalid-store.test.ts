import { store, PERSISTENCY_KEY } from '../src'

afterEach(() => jest.restoreAllMocks())
test('should reset the store if contains an invalid value', () => {
  jest.spyOn(global.console, 'warn').mockImplementation(() => {})
  localStorage.setItem(PERSISTENCY_KEY, 'not valid json')

  expect(() => store.hydrate()).not.toThrow()
  expect(localStorage.getItem(PERSISTENCY_KEY)).toBeNull()
  expect(console.warn).toHaveBeenCalledWith(`
[virtual-cookie] Failed to parse a stored cookie from the localStorage (key \"MSW_COOKIE_STORE\").

Stored value:
not valid json

Thrown exception:
SyntaxError: Unexpected token o in JSON at position 1

Invalid value has been removed from localStorage to prevent subsequent failed parsing attempts.`)
})
