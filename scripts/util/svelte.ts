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
