/**
 * @fileoverview Fires `onVisible`/`onHidden` on document visibilitychange —
 * a thin, device-agnostic wrapper. Whether a given visibility transition
 * should be treated as the app being "opened" or "closed" is a per-feature
 * decision (e.g. desktop tab-switching vs. mobile backgrounding), so that
 * logic belongs in the caller, not here.
 */

import { useRef } from 'react'
import { useEventListener } from 'usehooks-ts'

interface UseAppVisibilityOptions {
  onVisible?: () => void
  onHidden?: () => void
}

export const useAppVisibility = ({
  onVisible,
  onHidden,
}: UseAppVisibilityOptions) => {
  const documentRef = useRef<Document>(document)
  useEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible') {
        onVisible?.()
      } else {
        onHidden?.()
      }
    },
    documentRef
  )
}
