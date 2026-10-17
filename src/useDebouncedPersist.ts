/**
 * @fileoverview Debounced localStorage persistence for provider state.
 */

import { useEffect, useRef } from 'react'
import { debounce } from 'es-toolkit'
import type { Jsonifiable } from 'type-fest'

import { onAppLeave } from './utils/page'

/** Long enough to collapse a burst (e.g. a sync flush rewriting a whole
 *  collection), short enough that a write never feels at risk. */
const PERSIST_DEBOUNCE_MS = 250

type DebouncedWrite = ReturnType<typeof debounce<(v: Jsonifiable) => void>>

/**
 * Persists `value` to localStorage under `key`, debounced so rapid successive
 * updates serialize once instead of per update.
 *
 * Pending writes flush on tab hide/close, key change, and unmount, so
 * offline-first data is never lost to the debounce window.
 *
 * `null` clears the key rather than storing it, so state that means "nothing
 * held" -- unsent work that has since drained -- leaves nothing behind for the
 * next load to read.
 */
export const useDebouncedPersist = (
  key: string,
  value: Jsonifiable,
  enabled = true
) => {
  const writeRef = useRef<DebouncedWrite | null>(null)

  useEffect(() => {
    const write = debounce((v: Jsonifiable) => {
      try {
        if (v === null) localStorage.removeItem(key)
        else localStorage.setItem(key, JSON.stringify(v))
      } catch {
        // Ignore storage errors (e.g. quota) — the next change retries.
      }
    }, PERSIST_DEBOUNCE_MS)
    writeRef.current = write
    return () => {
      write.flush()
      writeRef.current = null
    }
  }, [key])

  useEffect(() => {
    if (enabled) writeRef.current?.(value)
  }, [value, enabled])

  // Flush on tab close/hide so no write is lost to the debounce window.
  useEffect(() => onAppLeave(() => writeRef.current?.flush()), [])
}
