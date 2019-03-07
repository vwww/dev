<script lang="ts">
import { pState } from '@/util/svelte.svelte'

const intervalCount = pState('tool/freq/intervalCount', -1)
const startTime = pState('tool/freq/startTime', 0)
const prevTime = pState('tool/freq/prevTime', 0)
const lastDelay = pState('tool/freq/lastDelay', 0)
const sumTime = pState('tool/freq/sumTime', 0)
const sumFreq = pState('tool/freq/sumFreq', 0)

function addEvent () {
  if (++intervalCount.value) {
    const now = Date.now()
    lastDelay.value = now - prevTime.value
    prevTime.value = now
    sumTime.value = now - startTime.value
    sumFreq.value += 1 / lastDelay.value
  } else {
    startTime.value = prevTime.value = Date.now()
    sumFreq.value = 0
  }
}

function resetEvents () {
  intervalCount.value = -1
}
</script>

<div class="btn-group d-flex mb-3" role="group">
  <button onclick={addEvent} class="btn btn-outline-primary">Add Event</button>
  <button onclick={resetEvents} class="btn btn-outline-secondary" class:disabled={intervalCount.value < 0}>Reset</button>
</div>

{#if intervalCount.value < 0}
  <h2>Add two events!</h2>
{:else if !intervalCount.value}
  <h2>Add another event!</h2>
{:else}
{@const avgTime = sumTime.value / intervalCount.value}
{@const avgFreq = sumFreq.value / intervalCount.value}
<table class="table table-striped table-bordered table-hover caption-top w-auto">
  <caption>Count of intervals = {intervalCount.value}</caption>
  <thead>
    <tr>
      <th scope="col">Quantity</th>
      <th scope="col">s</th>
      <th scope="col">/s</th>
      <th scope="col">/min</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">Last</th>
      <td class="text-end">{(0.001 * lastDelay.value).toFixed(3)}</td>
      <td class="text-end">{(1000 / lastDelay.value).toFixed(3)}</td>
      <td class="text-end">{(60000 / lastDelay.value).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Avg Time</th>
      <td class="text-end">{(0.001 * avgTime).toFixed(3)}</td>
      <td class="text-end">{(1000 / avgTime).toFixed(3)}</td>
      <td class="text-end">{(60000 / avgTime).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Avg Freq</th>
      <td class="text-end">{(0.001 / avgFreq).toFixed(3)}</td>
      <td class="text-end">{(1000 * avgFreq).toFixed(3)}</td>
      <td class="text-end">{(60000 * avgFreq).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Sum Time</th>
      <td class="text-end">{(0.001 * sumTime.value).toFixed(3)}</td>
      <td class="text-end">{(1000 / sumTime.value).toFixed(3)}</td>
      <td class="text-end">{(60000 / sumTime.value).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Sum Freq</th>
      <td class="text-end">{(0.001 / sumFreq.value).toFixed(3)}</td>
      <td class="text-end">{(1000 * sumFreq.value).toFixed(3)}</td>
      <td class="text-end">{(60000 * sumFreq.value).toFixed(3)}</td>
    </tr>
  </tbody>
</table>
{/if}
