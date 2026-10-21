/**
 * @fileoverview Whether the browser reports a network connection, kept current.
 */

import { useState } from 'react'
import { useEventListener } from 'usehooks-ts'

interface UseIsOnlineOptions {
  /** Called on each `online`/`offline` event, with the state it moved to. */
  onChange?: (isOnline: boolean) => void
}

/**
 * Whether the browser reports being online, re-rendering the caller as that
 * changes.
 *
 * Only as reliable as `navigator.onLine`: `false` means no network at all, but
 * `true` doesn't promise a server is reachable.
 */
export const useIsOnline = ({ onChange }: UseIsOnlineOptions = {}): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEventListener('online', () => {
    onChange?.(true)
    setIsOnline(true)
  })
  useEventListener('offline', () => {
    onChange?.(false)
    setIsOnline(false)
  })

  return isOnline
}
