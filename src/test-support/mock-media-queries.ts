/**
 * @fileoverview Test helpers that decide which media queries match, since
 * happy-dom matches none on its own. Each replaces `window.matchMedia`
 * outright, so the last one a case calls is the one in effect.
 */

import { vi } from 'vitest'

import { TAILWIND_BREAKPOINTS } from '@/constants/tailwind'
import { getBelowBreakpointQuery } from '@/useMobile'
import { TOUCH_QUERY } from '@/utils/device'

/** Stubs `window.matchMedia` so a query matches exactly when `isMatch` says it does. */
export const mockMatchMedia = (isMatch: (query: string) => boolean) => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: isMatch(query),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

/** Makes `useIsMobile(breakpoint)` report a mobile viewport, or not. */
export const mockMobile = (
  isMobile: boolean,
  breakpoint: number = TAILWIND_BREAKPOINTS.MD
) =>
  mockMatchMedia(
    (query) => isMobile && query === getBelowBreakpointQuery(breakpoint)
  )

/** Makes `isTouchDevice` report a touch screen, or not. */
export const mockTouchDevice = (isTouch: boolean) =>
  mockMatchMedia((query) => isTouch && query === TOUCH_QUERY)
