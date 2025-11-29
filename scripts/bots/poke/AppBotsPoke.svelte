<script lang="ts">
import Entry from './Entry.svelte'

import { type EntryInfo, parseEntry } from './EntryInfo'
import type { PokeInfo } from './PokeInfo'
import type { PokeSource } from './PokeSource'
import PokeSourceFirebase from './PokeSourceFirebase'

import { onMount } from 'svelte'
import { pState } from '@/util/svelte.svelte'

import Highcharts from 'highcharts'
import 'highcharts/modules/exporting'
import 'highcharts/modules/offline-exporting'
import 'highcharts/modules/accessibility'

// Persistent variables
const leaderboardLimit = pState('bot/poke/leaderboardLimit', 10)
const leaderboardTie = pState('bot/poke/leaderboardTie', 2)
const leaderboardMinPokes = pState('bot/poke/leaderboardMinPokes', 1)

// Poke entries sorted by pokes then time
let data1: EntryInfo[] = $state([])

// Poke entries sorted by time
let data2: EntryInfo[] = $state([])

// Data for highcharts
let yData: number[][] = $state([])

function computeRanks (): void {
  let rDense = 0
  let rCompetition = 0
  let rModified = 0
  let rFractional = 0
  for (let i = 0; i < data1.length; ++i) {
    const cur = data1[i]
    // check for continued tie
    let tie = 0
    if (i && cur.num === data1[i - 1].num) {
      tie = 2
    } else {
      // recompute ranks
      ++rDense
      rCompetition = rModified = i + 1
      while (rModified < data1.length && cur.num === data1[rModified].num) ++rModified
      rFractional = (rCompetition + rModified) / 2
      // check for first tie
      tie = rCompetition !== rModified ? 1 : 0
    }
    const rOrdinal = i + 1

    data1[i].tie = tie
    data1[i].rank[1] = rDense
    data1[i].rank[2] = rCompetition
    data1[i].rank[3] = rFractional
    data1[i].rank[4] = rModified
    data1[i].rank[5] = rOrdinal
  }
  // Rank by time
  for (let i = 0; i < data2.length; ++i) data2[i].rank[0] = i + 1
}

function updatePoke (data: Record<string, PokeInfo>): void {
  // Convert object to array, and filter out empty elements
  data1 = Object.keys(data).map((k) => parseEntry(data[k], k))
  data2 = data1.slice(0) // shallow copy

  // Sort
  data1.sort((a, b) => (b.num - a.num) || (a.time - b.time)) // higher number, earlier time first
  data2.sort((a, b) => b.time - a.time) // later time first

  // Compute ranks
  computeRanks()

  // Update plot
  const firstTime = data2[0].time
  const oldestTime = data2[data2.length - 1].time
  yData = [
    data1.map((x) => x.num),
    data2.map((x) => (firstTime - x.time) / 86400),
    data2.map((x) => (x.time - oldestTime) / 86400),
  ]
}

let infoPokes: number | undefined = $state()
let infoTicks: number | undefined = $state()

function updateInfo (pokes: number, ticks: number): void {
  infoPokes = pokes
  infoTicks = ticks
}

onMount(() => {
  const pokeSource: PokeSource = new PokeSourceFirebase()
  pokeSource.onInfoUpdate(updateInfo)
  pokeSource.onPokeUpdate(updatePoke)

  return () => {
    pokeSource.destroy()
  }
})

const highchartsOptions: Highcharts.Options = $derived({
  chart: {
    type: 'line',
    zooming: {
      type: 'x'
    },
  },
  colors: [
    // plotly.js colors
    // https://github.com/plotly/plotly.js/blob/v2.35.3/src/components/color/attributes.js#L5-L16
    '#1f77b4',  // muted blue
    '#ff7f0e',  // safety orange
    '#2ca02c',  // cooked asparagus green
    '#d62728',  // brick red
    '#9467bd',  // muted purple
    '#8c564b',  // chestnut brown
    '#e377c2',  // raspberry yogurt pink
    '#7f7f7f',  // middle gray
    '#bcbd22',  // curry yellow-green
    '#17becf',  // blue-teal
  ],
  credits: {
    enabled: false,
  },
  title: {
    text: undefined,
  },
  xAxis: [
    {
      type: 'logarithmic',
      title: {
        text: 'rank'
      },
    },
  ],
  yAxis: [
    {
      type: 'logarithmic',
      title: {
        text: 'number of pokes'
      },
    },
    {
      type: 'logarithmic',
      title: {
        text: 'days'
      },
      opposite: true,
    },
    {
      type: 'logarithmic',
      title: {
        text: undefined
      },
      opposite: true,
    },
  ],
  tooltip: {
    shared: true,
    crosshairs: true,
  },
  series: [
    {
      type: 'line',
      name: 'pokes (highest first)',
      data: yData[0],
      pointStart: 1,
    },
    {
      type: 'line',
      name: 'days before newest (recent first)',
      yAxis: 1,
      data: yData[1],
      pointStart: 1,
    },
    {
      type: 'line',
      name: 'days since oldest (oldest first)',
      yAxis: 2,
      data: yData[2],
      pointStart: yData[0]?.length,
      pointInterval: -1,
    },
    {
      type: 'line',
      name: 'pokes (lowest first)',
      data: yData[0],
      pointStart: yData[0]?.length,
      pointInterval: -1,
      visible: false,
    },
    {
      type: 'line',
      name: 'days since oldest (recent first)',
      yAxis: 2,
      data: yData[2],
      pointStart: 1,
      visible: false,
    },
    {
      type: 'line',
      name: 'days before newest (oldest first)',
      yAxis: 1,
      data: yData[1],
      pointStart: yData[0]?.length,
      pointInterval: -1,
      visible: false,
    },
  ]
})

function highcharts (node: HTMLElement, config: Highcharts.Options) {
  const chart = Highcharts.chart(node, config)

  const resizeObserver = new ResizeObserver(() => chart.reflow())

  resizeObserver.observe(node)

  return {
    update (config: Highcharts.Options) {
      chart.update(config, true, true)
    },

    destroy () {
      resizeObserver.disconnect()
      chart.destroy()
    },
  }
}
</script>

<div class="alert alert-secondary" role="alert">
  This bot is down. It has been discontinued, so it will not be restored for a long time.
</div>

<div class="row">
  <div class="col-8">
    <div class="alert alert-info" role="alert">
      I created a bot to win &lsquo;poke wars&rsquo; on Facebook by returning pokes. It can also start a poke war by poking a list.
    </div>
    <p>This page shows <strong>realtime</strong> updates for the statistics and leaderboard.</p>
    <p>The <a href="poke_old" class="alert-link">old leaderboard</a> has less formatting and is more lightweight.</p>
    <div class="alert alert-warning" role="alert">
      The leaderboard might miss some pokes before the end of July 2014.
      After Facebook removed profile images from their public API, the leaderboard now shows Identicon images.
      <!-- Stale entries may be pruned over time. -->
    </div>
  </div>
  <div class="col-4 clearfix">
    <ul class="list-group">
      <li class="list-group-item">
        <span class="badge text-bg-secondary">{data1.length || '?'}</span>
        Users Listed
      </li>
      <li class="list-group-item">
        <span class="badge text-bg-secondary">{infoPokes?.toLocaleString() ?? '?'}</span>
        Pokes Returned
      </li>
      <li class="list-group-item">
        <span class="badge text-bg-secondary">{infoTicks?.toLocaleString() ?? '?'}</span>
        Checks
      </li>
      <li class="list-group-item">
        <span class="badge text-bg-secondary">{infoPokes == null || infoTicks == null ? '?' : (infoPokes * 100 / infoTicks).toFixed(4) + '%'}</span>
        Duty Cycle
      </li>
    </ul>
  </div>
</div>

<h2>Opponent Distribution</h2>
<div use:highcharts={highchartsOptions}></div>

<h2>Leaderboard of Losers (LOL)</h2>

<div class="mb-3">
  <div class="input-group mb-3">
    <div class="input-group-text">
      Filter by minimum pokes
    </div>
    <input class="form-control" type="number" min="1" bind:value={leaderboardMinPokes.value}>
  </div>
  <div class="input-group mb-3">
    <div class="input-group-text">
      Limit
    </div>
    {#each [10, 25, 50, 100, 250, 500, 1000, 0] as limit}
      <div class="input-group-text">
        <label class="form-check">
          <input type="radio" class="form-check-input" bind:group={leaderboardLimit.value} value={limit}>
          {limit || 'all'}
        </label>
      </div>
    {/each}
    <input class="form-control" type="number" min="0" bind:value={leaderboardLimit.value}>
  </div>
  <div class="input-group mb-3">
    <div class="input-group-text">
      Ranking Method
    </div>
    {#each ['dense', 'competition', 'fractional', 'modified', 'ordinal'] as limit, i}
      <div class="input-group-text">
        <label class="form-check">
          <input type="radio" class="form-check-input" bind:group={leaderboardTie.value} value={i}>
          {limit}
        </label>
      </div>
    {/each}
  </div>
</div>

<div id="leaderboards" class="tie0 row clearfix">
  <div class="col-6">
    <h3>Top Opponents</h3>
    <ol class="leaderboard">
      {#each data1.slice(0, leaderboardLimit.value || data1.length) as entry}
        {#if entry.num >= leaderboardMinPokes.value}
          <Entry {entry} tie={entry.tie} rankIndex={leaderboardTie.value + 1} rankIndexOther={0} />
        {/if}
      {/each}
    </ol>
  </div>
  <div class="col-6">
    <h3>Recent Pokes</h3>
    <ol class="leaderboard">
      {#each data2.filter((e) => e.num >= leaderboardMinPokes.value).slice(0, leaderboardLimit.value || data2.length) as entry}
        <Entry {entry} tie={0} rankIndex={0} rankIndexOther={leaderboardTie.value + 1} />
      {/each}
    </ol>
  </div>
</div>

<style>
.leaderboard {
  list-style: none;
  padding: 12px;
}
</style>
