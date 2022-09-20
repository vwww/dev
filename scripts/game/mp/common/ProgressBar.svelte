<script lang="ts">
export let start = 0
export let end = 1
export let startTime = Date.now()
export let endTime = Date.now() + 20000

import { onMount } from 'svelte'

let progress = 0
let remain = '0.0 s'

onMount(() => {
  let animHandle: number
  (function renderLoop () {
    animHandle = requestAnimationFrame(renderLoop)

    const now = Date.now()
    progress = start + (end - start) * Math.min(1, (now - startTime) / (endTime - startTime))
    remain = Math.max((endTime - now) / 1000, 0).toFixed(1) + ' s'
  })()
  return () => cancelAnimationFrame(animHandle)
})
</script>

<div class="progress mb-2">
  <div class="progress-bar progress-bar-striped progress-bar-animated" style="transition: none; width:{progress * 100}%">{remain}</div>
</div>
