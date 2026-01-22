const KEY = 'theme'

export function init (): void {
  for (const e of document.getElementsByClassName('theme-switcher')) {
    e.addEventListener('click', function themeSwitcherClick (this: HTMLElement, event) {
      event.preventDefault()
      const { theme } = this.dataset
      set(theme!)
      if (window.localStorage) localStorage[KEY] = theme
    })
  }
  if (window.localStorage) {
    // Restore theme
    if (localStorage[KEY] !== undefined) set(localStorage[KEY] as string)
    // Listen for changes from other tabs
    addEventListener('storage', (e) => e.storageArea === localStorage && e.key === KEY && set(e.newValue!))
    // Remove save warning
    const { classList } = document.getElementById('theme-switcher-msg') as HTMLDivElement
    classList.remove('bg-danger')
    classList.add('bg-info')
    document.getElementById('theme-switcher-msg-text')!.innerText = 'Can save'
    for (const e of document.getElementsByClassName('theme-switcher-msg')) {
      e.remove()
    }
  }
}

export function set (theme: string): void {
  document.getElementById('theme-switcher')?.setAttribute('href', document.getElementById('theme-' + theme)?.getAttribute('content')!)
  for (const e of document.getElementsByClassName('theme-switcher')) {
    e.classList[(e as HTMLElement).dataset.theme === theme ? 'add' : 'remove']('active')
  }
}
