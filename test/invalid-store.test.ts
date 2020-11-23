import { store, PERSISTENCY_KEY } from '../src'

afterEach(() => jest.restoreAllMocks())
test('should reset the store if contains an invalid value', () => {
  jest.spyOn(global.console, 'warn').mockImplementation(() => {})
  localStorage.setItem(PERSISTENCY_KEY, 'not valid json')

  expect(() => store.hydrate()).not.toThrow()
  expect(localStorage.getItem(PERSISTENCY_KEY)).toBeNull()
  expect(console.warn).toHaveBeenCalledWith(`[MSW] the storage used for cookies has an invalid value "not valid json".
This key is used internally by MSW to store cookies.`)
})