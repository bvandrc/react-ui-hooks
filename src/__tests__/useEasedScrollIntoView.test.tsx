import { act, render, renderHook } from '@testing-library/react'

import { useEasedScrollIntoView } from '../useEasedScrollIntoView'

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

/** How much of the scroll container shows at once. */
const VISIBLE_HEIGHT = 200

/**
 * Renders a scrollable ancestor with one child inside it, with layout stubbed
 * so the child sits `top` below the ancestor's content top and is `height`
 * tall -- happy-dom does no real layout, so the hook would have nothing to
 * scroll to without this.
 */
const renderElInScrollParent = ({
  top,
  height,
}: {
  top: number
  height: number
}) => {
  const { getByTestId } = render(
    <div data-testid="scroll-parent" style={{ overflowY: 'auto' }}>
      <div data-testid="el" />
    </div>
  )
  const scrollParent = getByTestId('scroll-parent')
  vi.spyOn(scrollParent, 'clientHeight', 'get').mockReturnValue(VISIBLE_HEIGHT)
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      if (this === scrollParent) return { top: 0 } as DOMRect
      const elTop = top - scrollParent.scrollTop
      return { top: elTop, bottom: elTop + height } as DOMRect
    }
  )
  return { el: getByTestId('el'), scrollParent }
}

/** Longer than the hook's own anchor-suppression window, so it's always done by then. */
const PAST_SUPPRESSION_MS = 400

describe('useEasedScrollIntoView', () => {
  it('scrolls the element where block asks', () => {
    const { el, scrollParent } = renderElInScrollParent({
      top: 50,
      height: 100,
    })
    const { result } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'start'))

    // Where each `block` lands is `getTargetScrollTop`'s own behavior to
    // cover -- this only checks the hook writes what it works out.
    expect(scrollParent.scrollTop).toBe(50)
  })

  it('never writes to scrollTop while the element is already fully visible', () => {
    // A transition resizing something nearby can make even a same-value
    // write to `scrollTop` a live scroll action, so the fix is to never make
    // that write at all rather than to make it land correctly.
    const { el, scrollParent } = renderElInScrollParent({
      top: 50,
      height: 100,
    })
    const scrollTopSetter = vi
      .spyOn(scrollParent, 'scrollTop', 'set')
      .mockImplementation(() => {
        // Left unimplemented deliberately: a call reaching this at all,
        // for any value, is what the test below is checking didn't happen.
      })
    const { result } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'nearest'))

    expect(scrollTopSetter).not.toHaveBeenCalled()
  })

  it("turns off the scroll container's own scroll anchoring, restoring it once the suppression window elapses", () => {
    vi.useFakeTimers()
    const { el, scrollParent } = renderElInScrollParent({
      top: 250,
      height: 100,
    })
    scrollParent.style.overflowAnchor = 'auto'
    const { result } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'nearest'))
    // CSS scroll anchoring reacting to a layout shift alongside this
    // scroll (an expanding toolbar under `el`, say) is what caused the
    // overshoot-and-settle bug -- there's nothing else it should be
    // protecting here, since this container's position is exactly what's
    // being managed for the length of the suppression window.
    expect(scrollParent.style.overflowAnchor).toBe('none')

    act(() => vi.advanceTimersByTime(PAST_SUPPRESSION_MS))
    expect(scrollParent.style.overflowAnchor).toBe('auto')
  })

  it("restores the scroll container's scroll anchoring on cancel", () => {
    vi.useFakeTimers()
    const { el, scrollParent } = renderElInScrollParent({
      top: 250,
      height: 100,
    })
    scrollParent.style.overflowAnchor = 'auto'
    const { result } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'nearest'))
    act(() => result.current.cancel())

    expect(scrollParent.style.overflowAnchor).toBe('auto')
  })

  it('cancels a still-pending anchor restoration when a new scroll starts', () => {
    vi.useFakeTimers()
    const { el, scrollParent } = renderElInScrollParent({
      top: 250,
      height: 100,
    })
    const other = document.createElement('div')
    scrollParent.appendChild(other)
    const { result } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'nearest'))
    // Most, but not all, of the first call's own suppression window --
    // its restoration is still pending when the second call starts.
    act(() => vi.advanceTimersByTime(250))
    act(() => result.current.scrollIntoView(other, 'nearest'))
    // Past when the first call's own restoration would have fired, had the
    // second call not cancelled it -- catching it turning anchoring back
    // on mid-way through the second call's own suppression window.
    act(() => vi.advanceTimersByTime(60))

    expect(scrollParent.style.overflowAnchor).toBe('none')
  })

  it('stops a pending anchor restoration on unmount, leaving anchoring as it was', () => {
    vi.useFakeTimers()
    const { el, scrollParent } = renderElInScrollParent({
      top: 250,
      height: 100,
    })
    scrollParent.style.overflowAnchor = 'auto'
    const { result, unmount } = renderHook(() => useEasedScrollIntoView())

    act(() => result.current.scrollIntoView(el, 'nearest'))
    unmount()

    expect(scrollParent.style.overflowAnchor).toBe('auto')
  })
})
