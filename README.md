# @bvandrc/react-ui-hooks

React hooks and helpers for the browser UI behavior that's easy to get almost right: the visual viewport and on-screen keyboard, focus handoff and return, press-and-hold, and scrolling an element into view without fighting the page.

```bash
npm install @bvandrc/react-ui-hooks
```

Requires React 18 or 19. ESM only, with types included.

## Hooks

### Viewport and on-screen keyboard

| Export | What it does |
| --- | --- |
| `useVisualViewportPin` | Keeps a `fixed inset-0` element matched to `window.visualViewport`, so a full-screen sheet stays on screen and scrollable while the on-screen keyboard is open or the page is pinch-zoomed. |
| `useVisualViewportListener` | Calls a handler on each visual viewport `resize` or `scroll`, for as long as the component is mounted. |
| `useMakeRoomForPopover` | When a popover mounts too tall to fit above or below its trigger, scrolls the trigger's scroll area so it does. |
| `useScrollOnFocus` | Focus and blur handlers that scroll a focused element to where `block` (`start` or `nearest`) puts it and keep it there as it resizes. On touch devices, also restores the scroll position the on-screen keyboard leaves behind when it closes. |
| `useEasedScrollIntoView` | `scrollIntoView` within an element's own scroll container, eased, and cancelable. |
| `useIsMobile` | Whether the viewport is narrower than a breakpoint (Tailwind's `md` by default), flipping at exactly the width `md:` styles do. |

### Focus

| Export | What it does |
| --- | --- |
| `useFocusHandoff` | Hands focus to a target when the focused element inside a container unmounts, so focus doesn't fall to `<body>`. |
| `useFocusReturn` | Remembers what had focus when a dialog opened and returns focus to it on close; plugs straight into a Radix dialog's `onCloseAutoFocus`. |

### Press and toggle

| Export | What it does |
| --- | --- |
| `usePressHold` | Detects a press held in place, for a long-press action; cancels on movement, lift, the OS taking the touch over, or unmount. |
| `usePressToggle` | Active state for something hover or focus can also open, like a tooltip, that a tap, click, Enter, Space, or a screen reader's activation toggles. One that hover or focus opened stays open on the first activation. |

### State and timing

| Export | What it does |
| --- | --- |
| `useMaybeControlled` | A value that's controlled when the caller passes one, and managed internally when they don't. |
| `useStateRef` | `useState`, plus a ref that always holds the latest value set, for handlers built once. |
| `useTimer` | A timeout started from a handler rather than on render, replaced by the next `start` and cleared on unmount. |
| `useHasPassed` | Whether a date has passed, re-rendering at the moment it does with one timer rather than polling. |
| `useDebouncedPersist` | Persists a value to `localStorage`, debounced, and flushed when the app is hidden or closed so nothing is lost to the debounce window. |
| `useAppVisibility` | Calls `onVisible` or `onHidden` as the document's visibility changes. |

### Logging

| Export | What it does |
| --- | --- |
| `createLocalLogger` | A capped, timestamped log kept in `localStorage`, so a diagnostics report still covers what happened before a reload or an app update, plus hooks that log to it. |

## Helpers

Plain functions, usable outside React:

- **Device**: `isTouchDevice`, `detectDevice`, `TOUCH_QUERY`.
- **Input**: `isActivationKey`, `nativeActivationKeys`, `clickOnActivationKey`, `isTextEntry`, `blurFocusedTextInput`, `isComposing`, `isPrimaryPress`.
- **Layout**: `findScrollableAncestor`, `getVisibleBounds`, `getTargetScrollTop`, `getRoomAround`.
- **Page**: `onAppLeave`, which fires when the page is hidden or unloading, including the phone-kills-a-backgrounded-app case where `pagehide` never fires.
- **Sharing**: `shareFiles`, which opens the native share sheet and reports whether the caller should fall back, and `buildMailtoHref`.
- **Constants**: `TAILWIND_BREAKPOINTS`, Tailwind's default breakpoints in px.

## Test support

`@bvandrc/react-ui-hooks/test-support` has Vitest mocks for the browser APIs these hooks read and test DOMs like happy-dom and jsdom don't fully provide: `mockVisualViewport`, `mockResizeObserver`, `mockMatchMedia`, `mockMobile`, and `mockTouchDevice`. It needs `vitest` and `@testing-library/react`, which are optional peer dependencies.

## License

MIT
