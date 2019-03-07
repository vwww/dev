export function pState<T> (key: string, startValue: T, syncTabs = false) {
  let val = $state(startValue)

  function parse (s: string): T {
    return (s === 'undefined' ? undefined : JSON.parse(s)) as T
  }

  if (window.localStorage) {
    const json = localStorage.getItem(key)
    if (json !== null) {
      val = parse(json)
    }

    // needed to save nested properties
    $effect(() => localStorage.setItem(key, val === undefined ? 'undefined' : JSON.stringify(val)))

    if (syncTabs) {
      window.addEventListener('storage', (e) =>
        e.storageArea === localStorage && e.key === key
          && (val = e.newValue == null ? startValue : parse(e.newValue))
      )
    }
  }

  return {
    get value () {
      return val
    },
    set value (newVal) {
      val = newVal
    },
  }
}
