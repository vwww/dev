interface Timeago {
  (action?: 'init' | 'update' | 'updateFromDOM' | 'dispose'): JQuery
}

declare module '*.svelte' {
  const App: any
  export default App
}

declare module '*.txt' {
  const content: string
  export default content
}
