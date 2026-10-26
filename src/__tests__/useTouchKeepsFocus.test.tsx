import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { useTouchKeepsFocus } from '../useTouchKeepsFocus'

const T_IDS = {
  FIELD: 'field',
  TRIGGER_BTN: 'trigger',
  ITEM_BTN: 'item',
} as const

describe('useTouchKeepsFocus', () => {
  /**
   * Renders a focused text field beside a trigger and popover content wired to
   * the hook, returning the content's props.
   */
  const renderPopover = () => {
    const { result } = renderHook(() => useTouchKeepsFocus())
    const { triggerProps, contentProps } = result.current
    render(
      <>
        <input data-testid={T_IDS.FIELD} />
        <button
          type="button"
          data-testid={T_IDS.TRIGGER_BTN}
          {...triggerProps}
        />
        <div role="menu" tabIndex={-1} onMouseDown={contentProps.onMouseDown}>
          <button type="button" role="menuitem" data-testid={T_IDS.ITEM_BTN} />
        </div>
      </>
    )
    screen.getByTestId(T_IDS.FIELD).focus()
    return contentProps
  }

  /** An open autofocus event the hook can cancel, as a popover's would be. */
  const buildOpenEvent = () => new Event('focus', { cancelable: true })

  it('keeps focus in the field through a popover opened by touch', async () => {
    const user = userEvent.setup()
    const contentProps = renderPopover()
    const EVENT = buildOpenEvent()

    fireEvent.pointerDown(screen.getByTestId(T_IDS.TRIGGER_BTN), {
      pointerType: 'touch',
    })
    contentProps.onOpenAutoFocus(EVENT)
    await user.pointer({
      keys: '[TouchA]',
      target: screen.getByTestId(T_IDS.ITEM_BTN),
    })

    expect(EVENT.defaultPrevented).toBe(true)
    expect(screen.getByTestId(T_IDS.FIELD)).toHaveFocus()
  })

  it('lets a popover opened by mouse take focus', async () => {
    const user = userEvent.setup()
    const contentProps = renderPopover()
    const EVENT = buildOpenEvent()

    fireEvent.pointerDown(screen.getByTestId(T_IDS.TRIGGER_BTN), {
      pointerType: 'mouse',
    })
    contentProps.onOpenAutoFocus(EVENT)
    await user.click(screen.getByTestId(T_IDS.ITEM_BTN))

    expect(EVENT.defaultPrevented).toBe(false)
    expect(screen.getByTestId(T_IDS.ITEM_BTN)).toHaveFocus()
  })

  it('lets a popover opened by keyboard take focus, even after a touch', async () => {
    const user = userEvent.setup()
    const contentProps = renderPopover()
    const trigger = screen.getByTestId(T_IDS.TRIGGER_BTN)
    const EVENT = buildOpenEvent()

    fireEvent.pointerDown(trigger, { pointerType: 'touch' })
    trigger.focus()
    await user.keyboard('{Enter}')
    contentProps.onOpenAutoFocus(EVENT)

    expect(EVENT.defaultPrevented).toBe(false)
  })
})
