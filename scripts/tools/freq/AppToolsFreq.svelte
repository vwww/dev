<script>
import { pStore } from '../../util/svelte'

const avgByTime = pStore('tool/freq/avgByTime', true)

const intervalCount = pStore('tool/freq/intervalCount', -1)
const startTime = pStore('tool/freq/startTime')
const lastTime = pStore('tool/freq/lastTime')
const lastDelay = pStore('tool/freq/lastDelay')
const eventTime = pStore('tool/freq/eventTime')
const eventAvgTime = pStore('tool/freq/eventAvgTime')
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

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Average by</span>
  <button class="w-100 btn btn-outline-primary"
    class:active={$avgByTime}
    on:click={() => $avgByTime = true}>Time</button>
  <button class="w-50 btn btn-outline-secondary"
    class:active={!$avgByTime}
    on:click={() => $avgByTime = false}>Frequency</button>
</div>

{#if $intervalCount < 0}
  <h2>Add two events!</h2>
{:else if !$intervalCount}
  <h2>Add another event!</h2>
{:else}
  <div class="row">
    <div class="col-12 col-md-6">
      <h2 class="result">
        {#if $avgByTime}
          <span>{$intervalCount} interval{$intervalCount === 1 ? '' : 's'} over {($eventTime / 1000).toFixed(3)} s</span><br>
          <span>{(60000 / $eventAvgTime).toFixed(3)}</span>/min<br>
          <span>{(1000 / $eventAvgTime).toFixed(3)}</span>/s<br>
          <span>{(0.001 * $eventAvgTime).toFixed(3)} s/event</span>
        {:else}
          <span>{(1000 * $intervalCount / $eventAvgTime).toFixed(3)}/s over {$intervalCount} interval{$intervalCount === 1 ? '' : 's'}</span><br>
          <span>{(60000 * $eventAvgFreq).toFixed(3)}</span>/min<br>
          <span>{(1000 * $eventAvgFreq).toFixed(3)}</span>/s<br>
          <span>{(0.001 / $eventAvgFreq).toFixed(3)} s/event</span>
        {/if}
      </h2>
    </div>
    <div class="col-12 col-md-6">
      <h2 class="result">
        <span>Last interval over {($lastDelay / 1000).toFixed(3)} s</span><br>
        <span>{(60000 / $lastDelay).toFixed(3)}</span>/min<br>
        <span>{(1000 / $lastDelay).toFixed(3)}</span>/s<br>
        <span>{(0.001 * $lastDelay).toFixed(3)} s/event</span>
      </h2>
    </div>
  </div>
{/if}

{#if $avgByTime}
  <p>Average time shown = (sum of time) / count; average frequency = 1/(average time)</p>
{:else}
  <p>Average frequency shown = (sum of frequency) / count; average time = 1/(average frequency)</p>
{/if}

<p>Averaging time (frequency = 1/(average time)) and averaging frequency (time = 1/(average frequency)) are related by harmonic means.</p>

<style>
.result { font-family: monospace }
</style>
