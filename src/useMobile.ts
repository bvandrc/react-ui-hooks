/**
 * @fileoverview Mobile device detection hook based on viewport width.
 */

import { useMediaQuery } from 'usehooks-ts'

import { TAILWIND_BREAKPOINTS } from './constants/tailwind'

/**
 * A media query for viewports narrower than `breakpoint`. It stops 1px short,
 * since a `min-width` style at the same breakpoint (Tailwind's `md:`, say)
 * would otherwise match alongside it at exactly that width.
 */
export const getBelowBreakpointQuery = (breakpoint: number) =>
  `(max-width: ${breakpoint - 1}px)`

/**
 * Whether the viewport is narrower than `breakpoint`, which defaults to
 * Tailwind's `md` so it flips at the same width `md:` styles do.
 */
export const useIsMobile = (breakpoint: number = TAILWIND_BREAKPOINTS.MD) =>
  useMediaQuery(getBelowBreakpointQuery(breakpoint))
