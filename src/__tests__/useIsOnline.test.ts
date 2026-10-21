import { act, renderHook } from '@testing-library/react'

import { useIsOnline } from '../useIsOnline'

describe('useIsOnline', () => {
  const onLineSpy = vi.spyOn(navigator, 'onLine', 'get')
  afterAll(() => onLineSpy.mockRestore())

  it('starts from what the browser reports', () => {
    for (const isOnline of [true, false]) {
      onLineSpy.mockReturnValue(isOnline)
      const { result } = renderHook(() => useIsOnline())
      expect(result.current, String(isOnline)).toBe(isOnline)
    }
  })

  it('follows the browser going offline and back', () => {
    onLineSpy.mockReturnValue(true)
    const { result } = renderHook(() => useIsOnline())

    act(() => window.dispatchEvent(new Event('offline')))
    expect(result.current).toBe(false)

    act(() => window.dispatchEvent(new Event('online')))
    expect(result.current).toBe(true)
  })

  it('reports each change to onChange', () => {
    onLineSpy.mockReturnValue(true)
    const onChange = vi.fn()
    renderHook(() => useIsOnline({ onChange }))

    act(() => window.dispatchEvent(new Event('offline')))
    act(() => window.dispatchEvent(new Event('online')))

    expect(onChange.mock.calls).toEqual([[false], [true]])
  })
})
