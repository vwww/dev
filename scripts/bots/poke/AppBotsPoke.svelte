<script lang="ts">
import Entry from './Entry'

import { EntryInfo, parseEntry } from './EntryInfo'
import { PokeInfo } from './PokeInfo'
import { PokeSource } from './PokeSource'
import PokeSourceFirebase from './PokeSourceFirebase'

import { pStore } from '../../util/svelte'

import * as Plotly from './Plotly'

// Poke entries sorted by pokes then time
let data1: EntryInfo[] = []

// Poke entries sorted by time
let data2: EntryInfo[] = []

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
  const xVals = Array(data1.length).fill(undefined).map((_, index) => index + 1)
  const firstTime = data2[0].time
  void Plotly.restyle('opponentPlot', {
    x: [xVals, xVals],
    y: [data1.map((x) => x.num), data2.map((x) => (firstTime - x.time) / 86400)]
  })
}

const leaderboardLimit = pStore('bot/poke/leaderboardLimit', 10)
const leaderboardTie = pStore('bot/poke/leaderboardTie', 2)
const leaderboardMinPokes = pStore('bot/poke/leaderboardMinPokes', 1)

let infoPokes: number | undefined
let infoTicks: number | undefined

function updateInfo (pokes: number, ticks: number): void {
  infoPokes = pokes
  infoTicks = ticks
}

// Ready handler
function onReady () {
  const pokeSource: PokeSource = new PokeSourceFirebase()
  pokeSource.onInfoUpdate(updateInfo)
  pokeSource.onPokeUpdate(updatePoke)

  // Set up plot
  const data: Partial<Plotly.PlotData>[] = [
    { name: 'highest first', type: 'scatter'/*, line: {shape: 'linear'} */ },
    { name: 'recent first', type: 'scatter'/*, line: {shape: 'linear'} */, yaxis: 'y2' }
  ]
  const layout: Partial<Plotly.Layout> = {
    xaxis: { title: 'rank', type: 'log' },
    yaxis: { title: 'number of pokes', type: 'log' },
    yaxis2: { title: 'days before most recent poke', type: 'log', overlaying: 'y', side: 'right' },
    showlegend: false
  }
  void Plotly.newPlot('opponentPlot', data, layout)
}

// Resize handler
function onResize () {
  Plotly.Plots.resize(Plotly.d3.select('#opponentPlot').node() as Plotly.Root)
}
</script>

<svelte:window on:load={onReady} on:resize={onResize} />

<div class="row">
  <div class="col-8">
    <div class="alert alert-info" role="alert">
      <p>I created a bot to win &lsquo;poke wars&rsquo; on Facebook by returning pokes. It can also start a poke war by poking a list.</p>
      <p>Watch <strong>realtime</strong> updates for the statistics and leaderboard on this page.</p>
    </div>
    <p>The <a href="poke_old" class="alert-link">old leaderboard</a> has less formatting and is more lightweight.</p>
    <div class="alert alert-warning" role="alert">
      The leaderboard includes only recent pokes (since <span class="timeago" title="2014-07-30T04:15:43.000Z">the end of July 2014</span>).
      <!-- Stale entries may be pruned over time. -->
    </div>
  </div>
  <div class="col-4 clearfix">
    <ul class="list-group">
      <li class="list-group-item">
        <span class="badge bg-secondary">{infoPokes?.toLocaleString() ?? '?'}</span>
        Pokes Returned
      </li>
      <li class="list-group-item">
        <span class="badge bg-secondary">{infoTicks?.toLocaleString() ?? '?'}</span>
        Checks
      </li>
      <li class="list-group-item">
        <span class="badge bg-secondary">{infoPokes == undefined || infoTicks == undefined ? '?' : (infoPokes * 100 / infoTicks).toFixed(4) + '%'}</span>
        Duty Cycle
      </li>
    </ul>
  </div>
</div>

<h2>Opponent Distribution</h2>
<div id="opponentPlot"></div>

<h2>Leaderboard of Losers (LOL)</h2>

<div class="mb-3">
  Show up to
  <div class="btn-group btn-group-toggle" data-bs-toggle="buttons">
    {#each [10, 25, 50, 100, 250, 500, 1000, 0] as limit}
      <label class="btn btn-outline-secondary">
        <input type="radio" class="btn-check" bind:group={$leaderboardLimit} value={limit}> {limit || 'all'}
      </label>
    {/each}
  </div>
  entries
  using
  <div class="btn-group btn-group-toggle" data-bs-toggle="buttons">
    {#each ['dense', 'competition', 'fractional', 'modified', 'ordinal'] as limit, i}
      <label class="btn btn-outline-secondary">
        <input type="radio" class="btn-check" bind:group={$leaderboardTie} value={i}> {limit}
      </label>
    {/each}
  </div>
  ranking,
  <label>
    for those who poked at least
    <input type="number" min="1" bind:value={$leaderboardMinPokes}>
    times
  </label>
</div>

<div id="leaderboards" class="tie0 row clearfix">
  <div class="col-6">
    <h3>Top Opponents</h3>
    <ol class="leaderboard">
      {#each data1.slice(0, $leaderboardLimit || data1.length) as entry}
        {#if entry.num >= $leaderboardMinPokes}
          <Entry {entry} tie={entry.tie} rankIndex={$leaderboardTie + 1} rankIndexOther={0} />
        {/if}
      {/each}
    </ol>
  </div>
  <div class="col-6">
    <h3>Recent Pokes</h3>
    <ol class="leaderboard">
      {#each data2.filter(e => e.num >= $leaderboardMinPokes).slice(0, $leaderboardLimit || data2.length) as entry}
        <Entry {entry} tie={0} rankIndex={0} rankIndexOther={$leaderboardTie + 1} />
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
