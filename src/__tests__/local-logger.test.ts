import { renderHook } from '@testing-library/react'

// biome-ignore lint/suspicious/noDeprecatedImports: covers it while it still ships
import { createLocalLogger } from '../local-logger'

const STORAGE_KEY = 'test-local-log'

/** A logger as a page load gets one, persisting under `STORAGE_KEY`. */
const createLogger = () => createLocalLogger({ storageKey: STORAGE_KEY }).logger

const localLog = createLogger()

const getLastEntry = () => localLog.getEntries().at(-1)

describe('LocalLogger.error', () => {
  it('logs an Error as its message and stack, beside extra', () => {
    const ERROR = new Error('boom')
    localLog.error('api', 'items.list:failed', ERROR, { status: 500 })
    expect(getLastEntry()).toMatchObject({
      level: 'error',
      scope: 'api',
      action: 'items.list:failed',
      detail: { message: 'boom', stack: ERROR.stack, status: 500 },
    })
  })
})

describe('LocalLogger.catchTo', () => {
  it('swallows a rejection and logs it as an error', async () => {
    await expect(
      Promise.reject(new Error('gone')).catch(
        localLog.catchTo('sync', 'guestDeviceRelease:failed')
      )
    ).resolves.toBeUndefined()
    expect(getLastEntry()).toMatchObject({
      level: 'error',
      scope: 'sync',
      action: 'guestDeviceRelease:failed',
      detail: { message: 'gone' },
    })
  })
})

describe('LocalLogger persistence', () => {
  /**
   * A fresh logger, as a reload or a relaunch gets one. Each case writes
   * through its own: every earlier one is still listening, and the newest
   * writes last.
   */
  const reload = createLogger

  it('carries entries across a reload once the page hides', () => {
    const logger = reload()
    logger.info('cart', 'delete', { id: 7 })
    window.dispatchEvent(new Event('pagehide'))
    const reloaded = reload()
    expect(reloaded.getEntries()).toContainEqual(
      expect.objectContaining({ action: 'delete', detail: { id: 7 } })
    )
  })

  it('keeps what two tabs logged, whichever writes last', () => {
    const firstTab = reload()
    const secondTab = reload()
    // The second tab has already read the log, e.g. for a report.
    secondTab.getEntries()
    firstTab.info('cart', 'tab:first')
    secondTab.info('cart', 'tab:second')
    // Both tabs write, in turn.
    window.dispatchEvent(new Event('pagehide'))
    const actions = reload()
      .getEntries()
      .map(({ action }) => action)
    expect(actions).toEqual(expect.arrayContaining(['tab:first', 'tab:second']))
  })

  it('writes an entry only once across repeated hides', () => {
    const logger = reload()
    logger.info('cart', 'hide:once')
    window.dispatchEvent(new Event('pagehide'))
    window.dispatchEvent(new Event('pagehide'))
    const matches = reload()
      .getEntries()
      .filter(({ action }) => action === 'hide:once')
    expect(matches).toHaveLength(1)
  })

  it('reads nothing from storage at startup', () => {
    const getItemSpy = vi.spyOn(localStorage, 'getItem')
    reload()
    const readKeys = getItemSpy.mock.calls.map(([key]) => key)
    getItemSpy.mockRestore()
    expect(readKeys).not.toContain(STORAGE_KEY)
  })

  it('keeps only the newest 300 entries', () => {
    const STORED = Array.from({ length: 400 }, (_, index) => ({
      timestamp: new Date(0).toISOString(),
      scope: 'cart',
      action: `stored:${index}`,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STORED))
    const entries = reload().getEntries()
    expect(entries).toHaveLength(300)
    // The newest, not the oldest.
    expect(entries.at(-1)).toMatchObject({ action: 'stored:399' })
  })

  it('starts over from a stored value it cannot read', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: 'a list' }))
    expect(reload().getEntries()).toEqual([])
  })
})

/** Separate from `localLog`, so the persistence cases' reloads don't touch it. */
const {
  logger: hookLog,
  useLogDuration,
  useLogOnChange,
  useLogOnce,
} = createLocalLogger({ storageKey: 'test-local-log-hooks' })

/**
 * What a hook logged under `action` -- one name per case, since the cases
 * share the log and its cap can drop an older match as a new one lands.
 */
const getEntries = (action: string) =>
  hookLog.getEntries().filter((entry) => entry.action === action)

/** What `useLogDuration` logged for `action`, oldest first. */
const getSpanEntries = (action: string) =>
  hookLog.getEntries().filter((entry) => entry.action.startsWith(`${action}:`))

describe('useLogDuration', () => {
  /** Renders the hook, returning a way to flip `active`. */
  const renderSpan = (action: string, initiallyActive: boolean) => {
    let active = initiallyActive
    const rendered = renderHook(() => useLogDuration('cart', action, active))
    const setActive = (next: boolean) => {
      active = next
      rendered.rerender()
    }
    return { ...rendered, setActive }
  }

  it('logs the start, then the end with how long it lasted', () => {
    const ACTION = 'span:flips'
    const { setActive } = renderSpan(ACTION, true)
    expect(getSpanEntries(ACTION)).toEqual([
      expect.objectContaining({ scope: 'cart', action: `${ACTION}:start` }),
    ])
    setActive(false)
    expect(getSpanEntries(ACTION).at(-1)).toMatchObject({
      scope: 'cart',
      action: `${ACTION}:end`,
      detail: { ms: expect.any(Number) },
    })
  })

  it('logs nothing while inactive', () => {
    const ACTION = 'span:inactive'
    renderSpan(ACTION, false)
    expect(getSpanEntries(ACTION)).toHaveLength(0)
  })

  it('logs the end when unmounted mid-span', () => {
    const ACTION = 'span:unmounted'
    const { unmount } = renderSpan(ACTION, true)
    unmount()
    expect(getSpanEntries(ACTION).at(-1)).toMatchObject({
      action: `${ACTION}:end`,
    })
  })
})

describe('useLogOnChange', () => {
  /** Renders the hook, returning a way to change the value. */
  const renderOnChange = (action: string, initialValue: string) => {
    let value = initialValue
    const rendered = renderHook(() => useLogOnChange('auth', action, value))
    const setValue = (next: string) => {
      value = next
      rendered.rerender()
    }
    return { ...rendered, setValue }
  }

  it('logs the value on mount and on each change', () => {
    const ACTION = 'change:logsEach'
    const { setValue } = renderOnChange(ACTION, 'guest')
    setValue('auth-1')
    expect(getEntries(ACTION).map(({ detail }) => detail)).toEqual([
      'guest',
      'auth-1',
    ])
  })

  it('logs nothing more when re-rendered with the same value', () => {
    const ACTION = 'change:sameValue'
    const { setValue } = renderOnChange(ACTION, 'guest')
    setValue('guest')
    expect(getEntries(ACTION)).toHaveLength(1)
  })
})

describe('useLogOnce', () => {
  /** Renders the hook, returning a way to change `when` and the count. */
  const renderOnce = (action: string, initiallyWhen: boolean) => {
    let when = initiallyWhen
    let count = 1
    const rendered = renderHook(() =>
      useLogOnce('cart', action, when, { count })
    )
    const update = (next: { when?: boolean; count?: number }) => {
      when = next.when ?? when
      count = next.count ?? count
      rendered.rerender()
    }
    return { ...rendered, update }
  }

  it('logs once the condition first holds, with the detail of that render', () => {
    const ACTION = 'once:firstHolds'
    const { update } = renderOnce(ACTION, false)
    expect(getEntries(ACTION)).toHaveLength(0)
    update({ when: true, count: 3 })
    expect(getEntries(ACTION)).toEqual([
      expect.objectContaining({ scope: 'cart', detail: { count: 3 } }),
    ])
  })

  it('logs nothing more while mounted, whatever changes', () => {
    const ACTION = 'once:staysOnce'
    const { update } = renderOnce(ACTION, true)
    update({ count: 5 })
    update({ when: false })
    update({ when: true })
    expect(getEntries(ACTION)).toHaveLength(1)
  })
})
