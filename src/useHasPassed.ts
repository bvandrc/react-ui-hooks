/**
 * @fileoverview Whether a moment has passed, kept current as the clock moves.
 */

import { useState } from 'react'
import { useTimeout } from 'usehooks-ts'

/**
 * The longest delay `setTimeout` takes before overflowing and firing at once
 * (about 24.8 days).
 */
const MAX_TIMEOUT_MS = 2 ** 31 - 1

/**
 * Whether `date` has passed, re-rendering the caller at the moment it does.
 *
 * One timer per caller, set for that moment rather than polled, so it costs
 * nothing until it fires. A backgrounded page's timers run once it is back, so
 * a moment that passed in the meantime shows as soon as the page does.
 */
export const useHasPassed = (date: Date | null | undefined): boolean => {
  // Read off the clock once, so whether it has passed and how long until it
  // does can't disagree.
  const { msUntil, hasPassed } = date
    ? (() => {
        const msUntil_ = date.getTime() - Date.now()
        return { msUntil: msUntil_, hasPassed: msUntil_ <= 0 }
      })()
    : { msUntil: undefined, hasPassed: false }

  // Set when the timer fires, only to re-render the caller: what this returns
  // is worked out from the clock on every render.
  const [, setFiredAt] = useState<number>()

  useTimeout(
    () => setFiredAt(Date.now()),
    hasPassed || msUntil === undefined
      ? null
      : // A date past the longest delay waits in steps: each firing re-renders,
        // and the render after it sets the next step.
        Math.min(msUntil, MAX_TIMEOUT_MS)
  )

  return hasPassed
}
