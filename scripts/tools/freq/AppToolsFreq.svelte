<script lang="ts">
import { pStore } from '@/util/svelte'

const intervalCount = pStore('tool/freq/intervalCount', -1)
const startTime = pStore('tool/freq/startTime', 0)
const prevTime = pStore('tool/freq/prevTime', 0)
const lastDelay = pStore('tool/freq/lastDelay', 0)
const sumTime = pStore('tool/freq/sumTime', 0)
const sumFreq = pStore('tool/freq/sumFreq', 0)
$: avgTime = $sumTime / $intervalCount
$: avgFreq = $sumFreq / $intervalCount

function addEvent () {
  if (++$intervalCount) {
    const now = Date.now()
    $lastDelay = now - $prevTime
    $prevTime = now
    $sumTime = now - $startTime
    $sumFreq += 1 / $lastDelay
  } else {
    $startTime = $prevTime = Date.now()
  }
}

function resetEvents () {
  $intervalCount = -1
}
</script>

<div class="btn-group d-flex mb-3" role="group">
  <button on:click={addEvent} class="btn btn-outline-primary">Add Event</button>
  <button on:click={resetEvents} class="btn btn-outline-secondary">Reset</button>
</div>

{#if $intervalCount < 0}
  <h2>Add two events!</h2>
{:else if !$intervalCount}
  <h2>Add another event!</h2>
{:else}
<table class="table table-striped table-bordered table-hover caption-top w-auto">
  <caption>Count of intervals = {$intervalCount}</caption>
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
      <td class="text-end">{(0.001 * $lastDelay).toFixed(3)}</td>
      <td class="text-end">{(1000 / $lastDelay).toFixed(3)}</td>
      <td class="text-end">{(60000 / $lastDelay).toFixed(3)}</td>
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
      <td class="text-end">{(0.001 * $sumTime).toFixed(3)}</td>
      <td class="text-end">{(1000 / $sumTime).toFixed(3)}</td>
      <td class="text-end">{(60000 / $sumTime).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Sum Freq</th>
      <td class="text-end">{(0.001 / $sumFreq).toFixed(3)}</td>
      <td class="text-end">{(1000 * $sumFreq).toFixed(3)}</td>
      <td class="text-end">{(60000 * $sumFreq).toFixed(3)}</td>
    </tr>
  </tbody>
</table>
{/if}
