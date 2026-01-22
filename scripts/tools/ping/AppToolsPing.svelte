<script lang="ts">
import RollingStats from '@/util/RollingStats.svelte'
import { pState } from '@/util/svelte.svelte'

const pingURL = pState('tool/ping/url', 'https://google.com')
const pingInterval = pState('tool/ping/pInt', 1000)
const pingMax = pState('tool/ping/pMax', 100)

let curInterval = $state(0)

let rsPing: RollingStats | undefined = $state()
let rsJitter: RollingStats | undefined = $state()

type Metric = [name: string, formatter: (s: RollingStats) => number | string]
const metric: readonly Metric[] = [
  ['Last', stats => stats.getLast()],
  ['Average', stats => stats.getMean()],
  ['Min', stats => stats.getMin()],
  ['Max', stats => stats.getMax()],
  ['PopStdDev', stats => Math.sqrt(stats.getVariance())],
  ['SampleStdDev', stats => Math.sqrt(stats.getSampleVariance())],
  ['Count', stats => stats.getCount()],
]

function start () {
  const url = pingURL.value
  let remain = pingMax.value | 0
  rsPing = new RollingStats()
  rsJitter = new RollingStats()

  function doPing () {
    const start = Date.now()
    fetch(url, { method: 'HEAD' })
      .finally(function () {
        const delay = Date.now() - start

        if (rsPing!.getCount()) {
          rsJitter!.addValue(Math.abs(delay - rsPing!.getLast()))
        }
        rsPing!.addValue(delay)
      })

    if (remain && !--remain) {
      stop()
    }
  }

  curInterval = window.setInterval(doPing, pingInterval.value)
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
      <input type="url" class="form-control" bind:value={pingURL.value} readonly={!!curInterval} maxlength="20">
    </div>
  </div>
  <div class="col-12 col-md-6">
    <div class="input-group mb-2">
      <span class="input-group-text">Ping Interval: </span>
      <input type="number" class="form-control" placeholder="77ff00" bind:value={pingInterval.value} readonly={!!curInterval} min="1" max="10000">
      <span class="input-group-text"> ms</span>
    </div>
  </div>
  <div class="col-12 col-md-6 col-lg-5">
    <div class="input-group mb-2">
      <span class="input-group-text">Max Pings: </span>
      <input type="number" class="form-control" placeholder="77ff00" bind:value={pingMax.value} readonly={!!curInterval} min="0" max="10000">
      <span class="input-group-text"> (0 = unlimited)</span>
    </div>
  </div>
  <div class="col-12 col-lg-1">
    <div class="btn-group d-flex" role="group">
      {#if curInterval}
        <button onclick={stop} class="btn btn-danger w-100">Stop</button>
      {:else}
        <button onclick={start} class="btn btn-primary w-100">Start</button>
      {/if}
    </div>
  </div>
  <div class="col-12">
    <h3>Results</h3>
    {#if rsPing && rsJitter}
      {@const stats: [name: string, stats: RollingStats][] = [['Ping', rsPing], ['Jitter', rsJitter]]}
      <table class="table table-striped table-bordered table-hover w-auto">
        <thead>
          <tr>
            <th>Value</th>
            {#each stats as [name]}
              <th scope="col">{name}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each metric as m}
            <tr>
              <th scope="row">{m[0]}</th>
              {#each stats as [_, stat]}
                <td class="text-end">{m[1](stat)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      Click Start!
    {/if}
  </div>
</div>
