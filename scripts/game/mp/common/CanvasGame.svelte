<script lang="ts">
import { onMount } from 'svelte'

interface Props {
  gameState: {
    update (isInterval?: boolean): void
    render (ctx: CanvasRenderingContext2D): void
    attachCanvas (canvas: HTMLCanvasElement): void
  }
  aspect?: number
}

const { gameState, aspect = 2 }: Props = $props()

let canvasParent: HTMLElement
let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

function resize (): void {
  // if (document.fullscreen && document.fullscreenElement === canvas)
  if (window.innerWidth === window.screen.width && window.innerHeight === window.screen.height) {
    // fullscreen mode
    canvas.width = Math.min(window.innerWidth, window.innerHeight * aspect)
    canvas.height = Math.min(window.innerHeight, window.innerWidth / aspect)
  } else {
    canvas.width = Math.min(canvasParent.clientWidth, canvasParent.clientHeight * aspect)
    canvas.height = Math.min(canvasParent.clientHeight, canvasParent.clientWidth / aspect)
  }
}

onMount(() => {
  gameState.attachCanvas(canvas)

  ctx = canvas.getContext('2d')!
  document.addEventListener('fullscreenchange', resize)
  window.addEventListener('resize', resize)
  resize()

  let handle: number
  function renderLoop () {
    gameState.update()
    gameState.render(ctx)
    handle = requestAnimationFrame(renderLoop)
  }

  renderLoop()

  const interval = setInterval(() => gameState.update(true), 1000)

  return () => {
    document.removeEventListener('fullscreenchange', resize)
    window.removeEventListener('resize', resize)

    cancelAnimationFrame(handle)
    clearInterval(interval)
  }
})

export function requestFullscreen (options?: FullscreenOptions): Promise<void> {
  return canvas.requestFullscreen(options)
}
</script>

<div style="position: relative; width: 100%; padding-bottom: {100 / aspect}%">
  <div bind:this={canvasParent} style="position: absolute; top: 0; bottom: 0; left: 0; right: 0">
    <canvas bind:this={canvas} style="border: solid black 2px"></canvas>
  </div>
</div>
