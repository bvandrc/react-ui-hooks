/**
 * @fileoverview Tailwind constants.
 */

/**
 * Tailwind's default breakpoints in px, each the `min-width` its prefix
 * applies from.
 */
//Copied rather than read from `tailwindcss/defaultTheme`, so the package
// needs no Tailwind of its own; a unit test holds the two in step. Tailwind
// writes them in rem, which media queries resolve against the browser's
// default 16px, not the page's root font size.
export const TAILWIND_BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const
