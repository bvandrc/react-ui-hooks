import { renderHook } from '@testing-library/react'

import { useTimer } from '../useTimer'

const MS = 100

describe('useTimer', () => {
  const onTimeout = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('replaces a pending timeout when started again', () => {
    const { result } = renderHook(() => useTimer())

    result.current.start(onTimeout, MS)
    result.current.start(onTimeout, MS)
    vi.advanceTimersByTime(MS)

    expect(onTimeout).toHaveBeenCalledOnce()
  })

  it('cancels a pending timeout on clear and on unmount', () => {
    const { result, unmount } = renderHook(() => useTimer())

    result.current.start(onTimeout, MS)
    result.current.clear()
    vi.advanceTimersByTime(MS)
    expect(onTimeout, 'cleared').not.toHaveBeenCalled()

    result.current.start(onTimeout, MS)
    unmount()
    vi.advanceTimersByTime(MS)
    expect(onTimeout, 'unmounted').not.toHaveBeenCalled()
  })

  it('keeps its functions across renders', () => {
    // A consumer may list them as effect or callback dependencies.
    const { result, rerender } = renderHook(() => useTimer())
    const timer = result.current

    rerender()

    expect(result.current).toBe(timer)
  })
})
