<script lang="ts">
import { onMount } from 'svelte'

interface Props {
  start?: number
  end?: number
  startTime?: any
  endTime?: any
}

const {
  start = 0,
  end = 1,
  startTime = Date.now(),
  endTime = Date.now() + 20000,
}: Props = $props()

let progress = $state(0)
let remain = $state('0.0 s')

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
