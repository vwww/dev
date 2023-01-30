// timeago
interface Timeago {
  (action?: 'init' | 'update' | 'updateFromDOM' | 'dispose'): JQuery
}

// Svelte
declare module '*.svelte' {
  const App: any
  export default App
}

// *.txt files
declare module '*.txt' {
  const content: string
  export default content
}
