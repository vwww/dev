import App from './test.svelte'

const app = new App({
  target: document.querySelector('#app')
})

;(window as any).app = app // for testing purposes only
