import { writable, type Writable } from 'svelte/store'

export interface ValueStore<T> extends Writable<T> {
  get (): T
}

export function valueStore<T> (value: T, start?: (set: (value: T) => void) => (() => void) | void): ValueStore<T> {
  const { set, subscribe } = writable(value, start)
  return {
    get () {
      return value
    },
    set (newValue: T) {
      set(value = newValue)
    },
    subscribe,
    update (updater: (value: T) => T) {
      set(value = updater(value))
    },
  }
}

interface PStore<T> extends ValueStore<T> {
  useLocalStorage (): void
}

export function createPStore<T> (key: string, startValue: T): PStore<T> {
  const s = valueStore<T>(startValue)

  return {
    ...s,
    useLocalStorage: () => {
      if (!window.localStorage) return

      const json = localStorage.getItem(key)
      if (json !== null) {
        s.set((json === 'undefined' ? undefined : JSON.parse(json)) as T)
      }

      s.subscribe((current) => {
        if (current === undefined) {
          localStorage.removeItem(key)
        } else {
          localStorage.setItem(key, JSON.stringify(current))
        }
      })
    }
  }
}

export function pStore<T> (key: string, startValue: T): PStore<T> {
  const s = createPStore(key, startValue)
  s.useLocalStorage()
  return s
}
