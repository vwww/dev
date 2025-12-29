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

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D

function resize (): void {
  canvas.width = Math.floor(canvas.clientWidth * window.devicePixelRatio)
  canvas.height = Math.floor(canvas.clientHeight * window.devicePixelRatio)
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

<div style="border: solid black 2px; container-type: inline-size">
  <canvas bind:this={canvas} style="width: min(100cqw, {100 * aspect}cqh); height: min({100 / aspect}cqw, 100cqh)"></canvas>
</div>
