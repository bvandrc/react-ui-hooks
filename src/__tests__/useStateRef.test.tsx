import { act, renderHook } from '@testing-library/react'

import { useStateRef } from '../useStateRef'

describe('useStateRef', () => {
  it('updates the ref as soon as the value is set, and the state on render', () => {
    const { result } = renderHook(() => useStateRef(false))
    const [, setValue, ref] = result.current

    act(() => {
      setValue(true)
      // Before React re-renders: what a handler reading it mid-event sees.
      expect(ref.current).toBe(true)
    })

    expect(result.current[0]).toBe(true)
  })

  it('holds a function as the value, in the state and the ref alike', () => {
    // Plain `useState` would call it as an initializer, and then as an updater.
    const INITIAL = () => 'initial'
    const NEXT = () => 'next'
    const { result } = renderHook(() => useStateRef(INITIAL))
    expect(result.current[0], 'initial').toBe(INITIAL)

    act(() => result.current[1](NEXT))

    expect(result.current[0], 'state').toBe(NEXT)
    expect(result.current[2].current, 'ref').toBe(NEXT)
  })

  it('keeps the setter and ref across renders', () => {
    // A consumer may list them as effect or callback dependencies.
    const { result, rerender } = renderHook(() => useStateRef(0))
    const [, setValue, ref] = result.current

    rerender()

    expect(result.current[1]).toBe(setValue)
    expect(result.current[2]).toBe(ref)
  })
})
