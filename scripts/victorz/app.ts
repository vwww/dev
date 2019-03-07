import { mount } from 'svelte'

const devMode = process.env.NODE_ENV !== 'production'

export default function loadApp (Route: any): void {
  const target = document.getElementById('app')!
  const app = mount(Route, { target })

  if (devMode) {
    (window as any).app = app // potentially useful for debugging
  }

  // remove "failed to load" message
  document.getElementById('appLoading')?.remove()
}
