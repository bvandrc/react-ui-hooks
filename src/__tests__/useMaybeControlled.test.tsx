import { act, renderHook } from '@testing-library/react'

import { useMaybeControlled } from '../useMaybeControlled'

describe('useMaybeControlled', () => {
  it('holds the value itself when uncontrolled, starting from the default', () => {
    const { result } = renderHook(() =>
      useMaybeControlled<string>(undefined, undefined, 'start')
    )
    expect(result.current[0]).toBe('start')

    act(() => result.current[1]('next'))

    expect(result.current[0]).toBe('next')
  })

  it('follows the controlled value, and hands changes to its owner', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(
      ({ value }) => useMaybeControlled(value, onChange, 'default'),
      { initialProps: { value: 'owned' } }
    )
    expect(result.current[0]).toBe('owned')

    act(() => result.current[1]('asked'))

    expect(onChange).toHaveBeenCalledWith('asked')
    // The owner hasn't passed it back yet, so it stays as it was.
    expect(result.current[0]).toBe('owned')

    rerender({ value: 'asked' })
    expect(result.current[0]).toBe('asked')
  })
})
