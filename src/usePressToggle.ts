/**
 * @fileoverview Active state for something hover or focus can also activate,
 * where a tap, click, or activation of its trigger toggles it.
 */

import { useCallback, useMemo, useRef } from 'react'

import { useStateRef } from './useStateRef'
import {
  clickOnActivationKey,
  isPrimaryPress,
  isTextEntry,
  nativeActivationKeys,
} from './utils'

/**
 * Active state and trigger handlers, so activating the trigger toggles it.
 *
 * - A tap, click, Enter or Space, or a screen reader's activation all toggle.
 * - One that hover or focus made active stays active on the first activation,
 *   since a mouse hovers before it clicks and a keyboard focuses before Enter;
 *   the next one turns it off.
 * - A trigger that isn't a native button gets Enter and Space too.
 *
 * Spread `triggerProps` on the trigger, and route every other change through
 * `setIsActive`. Both keep their identity across renders.
 */
export const usePressToggle = () => {
  const [isActive, setIsActiveState, isActiveRef] = useStateRef(false)
  /**
   * Whether an activation made it active.
   *
   * Only that kind is one the next activation toggles off again.
   */
  const activatedByPressRef = useRef(false)
  /**
   * Whether a press had made it active as of pointerdown, before anything that
   * turns it off on a press has run; null when no press is waiting for its
   * click.
   */
  const pressActiveBeforeClickRef = useRef<boolean | null>(null)

  const setIsActive = useCallback((next: boolean) => {
    if (!next) activatedByPressRef.current = false
    setIsActiveState(next)
  }, [])

  const triggerProps = useMemo(() => {
    const isActivatedByPress = () =>
      isActiveRef.current && activatedByPressRef.current
    const toggle = (wasActivatedByPress: boolean) => {
      if (!wasActivatedByPress) activatedByPressRef.current = true
      setIsActive(!wasActivatedByPress)
    }
    const forgetPress = () => {
      pressActiveBeforeClickRef.current = null
    }

    return {
      onPointerDown: (event: React.PointerEvent<Element>) => {
        // Only the main button's press ends in a click.
        if (isPrimaryPress(event))
          pressActiveBeforeClickRef.current = isActivatedByPress()
      },
      // A press the browser takes over for a scroll won't end in a click. Not
      // pointerleave: a finger lifting fires it before its click.
      onPointerCancel: forgetPress,
      onClick: (event: React.MouseEvent<Element>) => {
        // A keyboard's or screen reader's click has a `detail` of 0 and no
        // pointerdown before it, so it reads the state as it is now.
        const pressActive = pressActiveBeforeClickRef.current
        forgetPress()
        toggle(
          event.detail > 0 && pressActive !== null
            ? pressActive
            : isActivatedByPress()
        )
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        // A key pressed on something inside the trigger, one the trigger
        // clicks on or types with by itself, or one it handled already, is its
        // own; anything else gets the click a button would, which `onClick`
        // toggles on.
        if (
          // Held down, the key repeats; a button clicks once.
          event.repeat ||
          event.target !== event.currentTarget ||
          event.defaultPrevented ||
          isTextEntry(event.currentTarget) ||
          nativeActivationKeys(event.currentTarget).includes(event.key)
        )
          return
        clickOnActivationKey(event)
      },
    }
  }, [setIsActive])

  return useMemo(
    () => ({ isActive, setIsActive, triggerProps }),
    [isActive, setIsActive, triggerProps]
  )
}
