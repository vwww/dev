const devMode = process.env.NODE_ENV !== 'production'

export default function loadApp (route: any): void {
  const app = new route({ target: document.getElementById('app') })

  if (devMode) {
    (window as any).app = app // potentially useful for debugging
  }

  // remove "failed to load" message
  document.getElementById('appLoading')?.remove()
}
