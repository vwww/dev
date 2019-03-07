<script lang="ts">
import { onMount } from 'svelte'

interface Props {
  startTime: number
  endTime: number
  start?: number
  end?: number
  active?: unknown
}

const {
  startTime,
  endTime,
  start = 0,
  end = 1,
  active,
}: Props = $props()

let progress = $state(0)
let remain = $state('0.0 s')

onMount(() => {
  let animHandle: number
  (function renderLoop () {
    animHandle = requestAnimationFrame(renderLoop)

    if (active) {
      const now = Date.now()
      progress = start + (end - start) * Math.min(1, (now - startTime) / (endTime - startTime))
      remain = Math.max((endTime - now) / 1000, 0).toFixed(1) + ' s'
    }
  })()
  return () => cancelAnimationFrame(animHandle)
})
</script>

<div class="progress">
  <div class="progress-bar{active ? ' progress-bar-striped progress-bar-animated' : ''}" style="transition: none; width:{progress * 100}%">{remain}</div>
</div>
