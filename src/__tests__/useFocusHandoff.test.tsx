import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useFocusHandoff } from '../useFocusHandoff'

const T_IDS = {
  BEFORE_BTN: 'before',
  TARGET_BTN: 'target',
  OUTSIDE_BTN: 'outside',
} as const

/**
 * Holds one button before the swap and the target after it, with another outside.
 *
 * `isBeforeShown` drops the first button without a swap, as removing a row would.
 */
const Swapper = ({
  isSwapped,
  isBeforeShown = true,
}: {
  isSwapped: boolean
  isBeforeShown?: boolean
}) => {
  const { containerProps, targetRef } = useFocusHandoff<
    HTMLDivElement,
    HTMLButtonElement
  >()
  return (
    <>
      {/* Keyed apart, so the swap unmounts one button rather than React
          reusing the node, which would keep focus on it untouched. */}
      <div {...containerProps}>
        {isSwapped ? (
          <button
            key={T_IDS.TARGET_BTN}
            type="button"
            ref={targetRef}
            data-testid={T_IDS.TARGET_BTN}
          />
        ) : (
          isBeforeShown && (
            <button
              key={T_IDS.BEFORE_BTN}
              type="button"
              data-testid={T_IDS.BEFORE_BTN}
            />
          )
        )}
      </div>
      <button type="button" data-testid={T_IDS.OUTSIDE_BTN} />
    </>
  )
}

describe('useFocusHandoff', () => {
  it('hands focus to the target when the swap unmounts the focused element', async () => {
    const { rerender } = render(<Swapper isSwapped={false} />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))

    rerender(<Swapper isSwapped />)

    expect(document.activeElement).toBe(screen.getByTestId(T_IDS.TARGET_BTN))
  })

  it('leaves focus alone when it moved out of the container before the swap', async () => {
    const { rerender } = render(<Swapper isSwapped={false} />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))
    await userEvent.click(screen.getByTestId(T_IDS.OUTSIDE_BTN))

    rerender(<Swapper isSwapped />)

    expect(document.activeElement).toBe(screen.getByTestId(T_IDS.OUTSIDE_BTN))
  })

  it('leaves focus alone when it was never in the container', () => {
    const { rerender } = render(<Swapper isSwapped={false} />)

    rerender(<Swapper isSwapped />)

    expect(document.activeElement).toBe(document.body)
  })

  it('leaves focus alone when the user sent it to <body> before the swap', async () => {
    const { rerender } = render(<Swapper isSwapped={false} />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))
    // Clicking blank page space: focus leaves for nowhere, with the button
    // still mounted.
    await userEvent.click(document.body)

    rerender(<Swapper isSwapped />)

    expect(document.activeElement).toBe(document.body)
  })

  it('leaves focus alone when it moved on after an earlier loss with no swap', async () => {
    const { rerender } = render(<Swapper isSwapped={false} />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))
    // Lost to <body> without a swap, then picked up outside without the
    // container ever seeing it leave.
    rerender(<Swapper isSwapped={false} isBeforeShown={false} />)
    screen.getByTestId(T_IDS.OUTSIDE_BTN).focus()

    rerender(<Swapper isSwapped isBeforeShown={false} />)

    expect(document.activeElement).toBe(screen.getByTestId(T_IDS.OUTSIDE_BTN))
  })

  it('leaves focus alone when the user sends it to <body> and that re-renders at once', async () => {
    /** A button whose blur re-renders, with the target mounted beside it. */
    const BlurRerenderer = () => {
      const [, setBlurCount] = useState(0)
      const { containerProps, targetRef } = useFocusHandoff<
        HTMLDivElement,
        HTMLButtonElement
      >()
      return (
        <div {...containerProps}>
          <button
            type="button"
            onBlur={() => setBlurCount((n) => n + 1)}
            data-testid={T_IDS.BEFORE_BTN}
          />
          <button
            type="button"
            ref={targetRef}
            data-testid={T_IDS.TARGET_BTN}
          />
        </div>
      )
    }

    render(<BlurRerenderer />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))

    // The blur's own re-render commits before the user's move to <body>
    // could be told apart from an unmount by anything but the button still
    // being mounted.
    await userEvent.click(document.body)

    expect(document.activeElement).toBe(document.body)
  })

  it('leaves focus alone when the user sends it to <body> and that unmounts the element', async () => {
    /** A button that unmounts itself on blur, as an inline editor closing would. */
    const BlurUnmounter = () => {
      const [isBeforeShown, setIsBeforeShown] = useState(true)
      const { containerProps, targetRef } = useFocusHandoff<
        HTMLDivElement,
        HTMLButtonElement
      >()
      return (
        <div {...containerProps}>
          {isBeforeShown && (
            <button
              type="button"
              onBlur={() => setIsBeforeShown(false)}
              data-testid={T_IDS.BEFORE_BTN}
            />
          )}
          <button
            type="button"
            ref={targetRef}
            data-testid={T_IDS.TARGET_BTN}
          />
        </div>
      )
    }

    render(<BlurUnmounter />)
    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))

    // The unmount follows the user's move to <body>, so it isn't a swap.
    await userEvent.click(document.body)

    expect(screen.queryByTestId(T_IDS.BEFORE_BTN)).toBeNull()
    expect(document.activeElement).toBe(document.body)
  })

  it('hands focus to the target when a child unmounts the focused element on its own', async () => {
    /** Removes itself on click, re-rendering only itself. */
    const SelfRemover = () => {
      const [isShown, setIsShown] = useState(true)
      return isShown ? (
        <button
          type="button"
          onClick={() => setIsShown(false)}
          data-testid={T_IDS.BEFORE_BTN}
        />
      ) : null
    }

    /** Holds the hook, and never re-renders after mounting. */
    const Host = () => {
      const { containerProps, targetRef } = useFocusHandoff<
        HTMLDivElement,
        HTMLButtonElement
      >()
      return (
        <div {...containerProps}>
          <SelfRemover />
          <button
            type="button"
            ref={targetRef}
            data-testid={T_IDS.TARGET_BTN}
          />
        </div>
      )
    }

    render(<Host />)

    await userEvent.click(screen.getByTestId(T_IDS.BEFORE_BTN))

    expect(screen.queryByTestId(T_IDS.BEFORE_BTN)).toBeNull()
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByTestId(T_IDS.TARGET_BTN))
    )
  })
})
