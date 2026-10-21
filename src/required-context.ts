import { createContext, useContext } from 'react'

/**
 * A context whose consumers must be under its provider, paired with the hook
 * that reads it.
 *
 * The hook throws instead of handing back `null`, so callers get the value
 * already narrowed to its type.
 *
 * `providerName` is the only thing worth saying that the runtime can't work
 * out: which hook was called is already the top frame of the thrown stack.
 */
export const createRequiredContext = <T>(providerName: string) => {
  const Context = createContext<T | null>(null)

  const useRequiredContext = () => {
    const value = useContext(Context)
    if (value === null) {
      throw new Error(`Must be used within a ${providerName}`)
    }
    return value
  }

  return [Context, useRequiredContext] as const
}
