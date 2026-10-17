/**
 * @fileoverview Language-level helpers for plain JavaScript values.
 */

import type { Entries } from 'type-fest'

/**
 * `Object.entries`, typed as the entries of what was passed.
 *
 * Carries the key-to-value correlation that `Object.entries` drops, so
 * destructuring an entry of a union-valued object narrows. Unsound the same
 * way `Object.entries` always is: a value can carry keys beyond the ones its
 * type names.
 */
export const typedEntries = <T extends Record<PropertyKey, unknown>>(o: T) =>
  Object.entries(o) as Entries<T>

/**
 * `Object.keys`, typed as the string keys of what was passed.
 *
 * Unsound the same way `Object.keys` always is: a value can carry keys
 * beyond the ones its type names.
 */
export const typedKeys = <T extends Record<PropertyKey, unknown>>(o: T) =>
  Object.keys(o) as (keyof T & string)[]
