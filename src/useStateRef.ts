/**
 * @fileoverview State paired with a ref to its latest value, for handlers that
 * need to read it without being rebuilt every time it changes.
 */

import { useCallback, useRef, useState } from 'react'

/**
 * `useState`, plus a ref that always holds the latest value set.
 *
 * The ref updates as soon as the setter is called, before the re-render, so a
 * handler built once can read it. The setter keeps its identity across renders.
 */
export const useStateRef = <T>(initial: T) => {
  // Both wrapped, so a function `T` is held as the value, where `useState`
  // would call it as an initializer or an updater and the ref would not.
  const [value, setValueState] = useState(() => initial)
  const ref = useRef(initial)

  const setValue = useCallback((next: T) => {
    ref.current = next
    setValueState(() => next)
  }, [])

  return [value, setValue, ref] as const
}
