import { mapKeys, mapValues } from 'es-toolkit'
import defaultTheme from 'tailwindcss/defaultTheme'

import { TAILWIND_BREAKPOINTS } from '../tailwind'

/** What a media query resolves 1rem to: the browser's default font size. */
const REM_PX = 16

describe('TAILWIND_BREAKPOINTS', () => {
  it("matches Tailwind's own default breakpoints", () => {
    const tailwindPx = mapKeys(
      mapValues(defaultTheme.screens, (rem) => Number.parseFloat(rem) * REM_PX),
      (_, name) => name.toUpperCase()
    )

    expect(TAILWIND_BREAKPOINTS).toEqual(tailwindPx)
  })
})
