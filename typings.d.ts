interface JQuery {
  packery: (...args: any[]) => void
}

interface Timeago {
  (action?: 'init' | 'update' | 'updateFromDOM' | 'dispose'): JQuery
}

declare module '*.svelte' {
  const App: any
  export default App
}
