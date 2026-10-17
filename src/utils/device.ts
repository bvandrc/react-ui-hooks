/**
 * @fileoverview What kind of device the page is running on.
 */

/** The media query `isTouchDevice` matches: a primary pointer as imprecise as a finger. */
export const TOUCH_QUERY = '(pointer: coarse)'

export const isTouchDevice = () =>
  typeof window !== 'undefined' && window.matchMedia(TOUCH_QUERY).matches

export type DeviceType = 'ios' | 'android' | 'desktop'

export const detectDevice = (): DeviceType => {
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}
