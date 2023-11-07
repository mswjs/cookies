/**
 * @jest-environment jsdom
 */
import { store, PERSISTENCY_KEY } from '../src'

afterEach(() => {
  jest.restoreAllMocks()
})

it('should reset the store if contains an invalid value', () => {
  jest.spyOn(global.console, 'warn').mockImplementation(() => {})
  localStorage.setItem(PERSISTENCY_KEY, 'not valid json')
  const mockConsole = jest.mocked(global.console.warn)
  expect(() => store.hydrate()).not.toThrow()
  expect(localStorage.getItem(PERSISTENCY_KEY)).toBeNull()
  const errorMessage = mockConsole.mock.calls[0][0]
  expect(errorMessage).toContain(`
[virtual-cookie] Failed to parse a stored cookie from the localStorage (key \"MSW_COOKIE_STORE\").

Stored value:
not valid json`)
  // not asserting on the entire error message because it's different in different node versions
  expect(errorMessage).toContain(`Thrown exception:
SyntaxError: Unexpected token`)
  expect(errorMessage).toContain(
    `Invalid value has been removed from localStorage to prevent subsequent failed parsing attempts.`,
  )
})
