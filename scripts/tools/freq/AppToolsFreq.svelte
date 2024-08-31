<script lang="ts">
import { pStore } from '@/util/svelte'

const intervalCount = pStore('tool/freq/intervalCount', -1)
const startTime = pStore('tool/freq/startTime', 0)
const lastTime = pStore('tool/freq/lastTime', 0)
const lastDelay = pStore('tool/freq/lastDelay', 0)
const eventTime = pStore('tool/freq/eventTime', 0)
const eventAvgTime = pStore('tool/freq/eventAvgTime', 0)
const eventAvgFreq = pStore('tool/freq/eventAvgFreq', 0)

function addEvent () {
  if (++$intervalCount) {
    const now = Date.now()
    $eventTime = now - $startTime
    $eventAvgTime = $eventTime / $intervalCount
    $lastDelay = now - $lastTime
    $eventAvgFreq += (1 / $lastDelay - $eventAvgFreq) / $intervalCount
    $lastTime = now
  } else {
    $startTime = $lastTime = Date.now()
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
      <td class="text-end">{(0.001 * $eventAvgTime).toFixed(3)}</td>
      <td class="text-end">{(1000 / $eventAvgTime).toFixed(3)}</td>
      <td class="text-end">{(60000 / $eventAvgTime).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Avg Freq</th>
      <td class="text-end">{(0.001 / $eventAvgFreq).toFixed(3)}</td>
      <td class="text-end">{(1000 * $eventAvgFreq).toFixed(3)}</td>
      <td class="text-end">{(60000 * $eventAvgFreq).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Sum Time</th>
      <td class="text-end">{(0.001 * $eventTime).toFixed(3)}</td>
      <td class="text-end">{(1000 / $eventTime).toFixed(3)}</td>
      <td class="text-end">{(60000 / $eventTime).toFixed(3)}</td>
    </tr>
    <tr>
      <th scope="row">Sum Freq</th>
      <td class="text-end"></td>
      <td class="text-end">{(1000 * $intervalCount / $eventAvgTime).toFixed(3)}</td>
      <td class="text-end">{(60000 * $intervalCount / $eventAvgTime).toFixed(3)}</td>
    </tr>
  </tbody>
</table>
{/if}
