<script lang="ts">
import jQuery from 'jquery'

import RollingStatsDisplay from './RollingStatsDisplay.svelte'
import RollingStats from '@/util/RollingStats'
import { pStore } from '@/util/svelte'

const pingURL = pStore('tool/ping/url', 'https://google.com')
const pingInterval = pStore('tool/ping/pInt', 1000)
const pingMax = pStore('tool/ping/pMax', 100)

let curInterval = 0

let rsPing: RollingStats, rsJitter: RollingStats

function start () {
  const url = $pingURL
  let remain = $pingMax | 0
  rsPing = new RollingStats()
  rsJitter = new RollingStats()

  function doPing () {
    const start = Date.now()
    function doneCallback () {
      const delay = Date.now() - start

      if (rsPing.getCount()) {
        rsJitter.addValue(Math.abs(delay - rsPing.getLast()))
        rsJitter = rsJitter // invalidate
      }
      rsPing.addValue(delay)
      rsPing = rsPing // invalidate
    }
    jQuery.ajax({
      url,
      method: 'HEAD',
      headers: { 'Cache-Control': 'no-cache' },
    })
      .done(doneCallback)
      .fail(doneCallback)

    if (remain && !--remain) {
      stop()
    }
  }

  curInterval = window.setInterval(doPing, $pingInterval)
  doPing()
}

function stop () {
  clearInterval(curInterval)
  curInterval = 0
}
</script>

<div class="row">
  <div class="col-12">
    <div class="input-group mb-2">
      <span class="input-group-text">Ping URL</span>
      <input type="url" class="form-control" bind:value={$pingURL} readonly={!!curInterval} maxlength="20">
    </div>
  </div>
  <div class="col-12 col-md-6">
    <div class="input-group mb-2">
      <span class="input-group-text">Ping Interval: </span>
      <input type="number" class="form-control" placeholder="77ff00" bind:value={$pingInterval} readonly={!!curInterval} min="1" max="10000">
      <span class="input-group-text"> ms</span>
    </div>
  </div>
  <div class="col-12 col-md-6 col-lg-5">
    <div class="input-group mb-2">
      <span class="input-group-text">Max Pings: </span>
      <input type="number" class="form-control" placeholder="77ff00" bind:value={$pingMax} readonly={!!curInterval} min="0" max="10000">
      <span class="input-group-text"> (0 = unlimited)</span>
    </div>
  </div>
  <div class="col-12 col-lg-1">
    <div class="btn-group d-flex" role="group">
      {#if curInterval}
        <button on:click={stop} class="btn btn-danger w-100">Stop</button>
      {:else}
        <button on:click={start} class="btn btn-primary w-100">Start</button>
      {/if}
    </div>
  </div>
  <div class="col-6">
    <h3>Ping Stats</h3>
    {#if rsPing}
      <RollingStatsDisplay stats={rsPing} />
    {:else}
      Click Start!
    {/if}
  </div>
  <div class="col-6">
    <h3>Jitter Stats</h3>
    {#if rsJitter}
      <RollingStatsDisplay stats={rsJitter} />
    {/if}
  </div>
</div>
