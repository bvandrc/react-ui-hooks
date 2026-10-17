/**
 * @fileoverview A log kept on the device, for production diagnostics, and the
 * React hooks that write to it.
 * Captures timestamped action logs in a capped buffer kept in localStorage, so
 * a report still covers what happened before a reload, an app update, or the
 * app being closed and reopened.
 */

import { useEffect, useRef } from 'react'

import { onAppLeave } from './utils/page'

/** `info` is the default, and the one level an entry leaves unsaid. */
export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  /** Left out at `info`, so only the levels worth noticing show. */
  level?: Exclude<LogLevel, 'info'>
  scope: string
  action: string
  detail?: unknown
}

export interface LocalLoggerOptions {
  /** The localStorage key the log persists under. */
  storageKey: string
  /** How many entries to keep, newest first; defaults to 300. */
  maxEntries?: number
}

const DEFAULT_MAX_ENTRIES = 300

const readStoredEntries = (storageKey: string): LogEntry[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]')
    // Anything else is a write this version can't read; start over.
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

export class LocalLogger<Scope extends string = string> {
  private readonly storageKey: string
  private readonly maxEntries: number
  /**
   * Logged since this page last wrote to storage. Storage itself is read only
   * when a report or a write needs it, so app load parses nothing.
   */
  private unsavedEntries: LogEntry[] = []

  constructor({
    storageKey,
    maxEntries = DEFAULT_MAX_ENTRIES,
  }: LocalLoggerOptions) {
    this.storageKey = storageKey
    this.maxEntries = maxEntries
    // Never unsubscribed: the logger lives as long as the page does.
    onAppLeave(() => this.persist())
  }

  info(scope: Scope, action: string, detail?: unknown) {
    this.push('info', scope, action, detail)
  }

  warn(scope: Scope, action: string, detail?: unknown) {
    this.push('warn', scope, action, detail)
  }

  /**
   * Logs a failure, with the thrown value spelled out as `message` and `stack`
   * (an `Error` serializes to `{}` in JSON) beside `extra`.
   */
  error(
    scope: Scope,
    action: string,
    error: unknown,
    extra?: Record<string, unknown>
  ) {
    this.push('error', scope, action, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...extra,
    })
  }

  /** A `.catch` handler that logs the rejection via `error` and swallows it. */
  catchTo(scope: Scope, action: string) {
    return (error: unknown) => this.error(scope, action, error)
  }

  private push(level: LogLevel, scope: Scope, action: string, detail: unknown) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      ...(level !== 'info' && { level }),
      scope,
      action,
      detail,
    }
    this.unsavedEntries.push(entry)
    if (this.unsavedEntries.length > this.maxEntries) {
      this.unsavedEntries = this.unsavedEntries.slice(-this.maxEntries)
    }
  }

  /**
   * This logger with `scope` already filled in, for a module that logs under
   * one scope throughout.
   */
  withScope(scope: Scope) {
    return {
      info: (action: string, detail?: unknown) =>
        this.info(scope, action, detail),
      warn: (action: string, detail?: unknown) =>
        this.warn(scope, action, detail),
      error: (
        action: string,
        error: unknown,
        extra?: Record<string, unknown>
      ) => this.error(scope, action, error, extra),
      catchTo: (action: string) => this.catchTo(scope, action),
    }
  }

  /** Every entry still kept, across sessions and tabs, oldest first. */
  getEntries(): LogEntry[] {
    // Read fresh each time, so what another tab has written since is included.
    return [
      ...readStoredEntries(this.storageKey),
      ...this.unsavedEntries,
    ].slice(-this.maxEntries)
  }

  private persist() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.getEntries()))
      // Written now, so the next write must not append them again. Only on
      // success: a failed write keeps them for the next try.
      this.unsavedEntries = []
    } catch {
      // Storage full or blocked: the log must never be what breaks the app.
    }
  }
}

/** A `LocalLogger`, alongside the React hooks that log to it. */
export const createLocalLogger = <Scope extends string = string>(
  options: LocalLoggerOptions
) => {
  const logger = new LocalLogger<Scope>(options)
  return {
    logger,
    /**
     * Logs `<action>:start` when `active` turns true, and `<action>:end` with the
     * milliseconds it lasted when it turns false or the caller unmounts.
     */
    useLogDuration: (scope: Scope, action: string, active: boolean) => {
      useEffect(() => {
        if (!active) return
        const startedAt = performance.now()
        logger.info(scope, `${action}:start`)
        return () =>
          logger.info(scope, `${action}:end`, {
            ms: Math.round(performance.now() - startedAt),
          })
      }, [scope, action, active])
    },

    /**
     * Logs `action` with `value` on mount, and again whenever `value` changes.
     *
     * Compared by identity, like an effect's deps, so pass a primitive or a
     * stable reference: an object built inline would log on every render.
     */
    useLogOnChange: (scope: Scope, action: string, value: unknown) => {
      useEffect(() => {
        logger.info(scope, action, value)
      }, [scope, action, value])
    },

    /**
     * Logs `action` with `detail` the first render `when` is true, and never
     * again for as long as the caller stays mounted.
     *
     * `detail` is read as it stands on that render, so it can be built inline.
     */
    useLogOnce: (
      scope: Scope,
      action: string,
      when: boolean,
      detail?: unknown
    ) => {
      const hasLoggedRef = useRef(false)
      // Read through a ref, so a fresh `detail` object every render doesn't
      // re-run the effect.
      const detailRef = useRef(detail)
      detailRef.current = detail

      useEffect(() => {
        if (!when || hasLoggedRef.current) return
        hasLoggedRef.current = true
        logger.info(scope, action, detailRef.current)
      }, [scope, action, when])
    },
  }
}
