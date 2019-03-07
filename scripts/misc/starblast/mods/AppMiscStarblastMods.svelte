<script lang="ts">
import * as d3 from 'd3'

import { onMount } from 'svelte'
import { pState } from '@/util/svelte.svelte'

import type { ModData, ModInfo } from './modinfo'
import { formatDelay, generateHistory, type ModEvent } from './history'
import { formatTime, generateData } from './data'

import modsinfo from './modsinfo.json'

const autoHistory = pState('misc/starblast/autoHistory', true)
const showHistoryTimes = pState('misc/starblast/showHistoryTimes', true)
const showDaily = pState('misc/starblast/showDaily', true)
const showDailyTime = pState('misc/starblast/showDailyTime', '20:00')
const hideMinor = pState('misc/starblast/hideMinor', false)
const showDelay = pState('misc/starblast/showDelay', false)

const modDataCached: ModInfo = modsinfo[0]

type ModTiming = [offset: number, mod: ModData]

let modEvent: ModEvent | undefined = $state()
let modEventLCM = $state(0)
let modEventTotalText = $state('')
let modEventTimetable: [mod: ModData, timings: string | ModTiming[], className?: string][] = $state([])
let modHistory = $state([generateHistory(modDataCached)])
let useLive = $state(false)
const activeModHistory = $derived(modHistory[useLive ? 1 : 0])
let loading = $state(false)
let loadError: unknown = $state('loading')

const MIN_TIME = +new Date('-010001-12-31T00:00Z')
const MAX_TIME = +new Date('+010000-01-02T00:00Z')
const HOUR_MS = 3600000
const DAY_MS = 86400000

type d3Sel<T extends d3.BaseType> = d3.Selection<T, unknown, null, undefined>

let chartNode: HTMLDivElement | undefined = $state()
let viz: d3Sel<SVGSVGElement>
let barGroup: d3Sel<SVGGElement>
let barTextGroup: d3Sel<SVGGElement>
let xAxis: d3Sel<SVGGElement>
let curTimeLine: d3Sel<SVGLineElement>
let extraTimeLines: d3Sel<SVGGElement>

let width = 100
let height = 100

const xScaleOrig = d3.scaleTime().domain([0, DAY_MS])
let xScale = xScaleOrig.copy()
const xAxisGenerator = d3.axisTop(xScale)

let pan = d3.zoom<SVGSVGElement, unknown>()
  .scaleExtent([DAY_MS / (MAX_TIME - MIN_TIME), Infinity])
  .on('zoom', function (e) {
    xScale = e.transform.rescaleX(xScaleOrig)
    render()
  })

function render (): void {
  const data = generateData(
    xScale,
    autoHistory.value ? activeModHistory : [modEvent!],
  )

  barGroup.selectAll('rect')
    .data(data)
    .join('rect')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y + 10)
      .attr('width', (d) => d.width)
      .attr('height', (d) => d.height)
      .attr('fill', (d) => d.fill)
      // .attr('stroke', 'rgba(0,0,0,0.3)')
      // .attr('stroke-width', 4)
      // .attr('stroke-dasharray', (d) => `70,${d.width}`)
      // .attr('stroke-dashoffset', 70)
    .selectAll('title')
      .data((d) => [d])
      .join('title')
      .text((d) => d.tooltip)

  barTextGroup.selectAll('text')
    .data(data.filter((d) => d.label))
    .join('text')
      .text((d) => d.label)
      .attr('x', (d) => (Math.max(d.x, 0) + Math.min(d.x + d.width, width)) / 2)
      .attr('y', (d) => 10 + 5 + d.y + d.height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')

  const xNow = xScale(Date.now())
  curTimeLine
    .attr('x1', xNow)
    .attr('x2', xNow)

  const extraTimes: [time: number, color: string][] = showHistoryTimes.value
    ? activeModHistory.map((event) => [xScale(event.time), event === modEvent ? 'blue' : 'gray'])
    : []

  if (showDaily.value && showDailyTime.value) {
    const [dStart, dEnd] = xScale.domain().map(Number)
    if (dEnd - dStart <= 6912e7) { // 800 days
      const t = new Date(dStart - (24 + 2) * 60 * 60 * 1000) // assuming DST shifts up to a maximum of 2 hours
      const [h, m] = showDailyTime.value.split(':').map(Number)
      t.setHours(h)
      t.setMinutes(m)

      let tPrev = +t
      let tCur
      while ((tCur = t.setDate(t.getDate() + 1)) < dEnd) {
        extraTimes.push([xScale(t), tCur - tPrev === 86400000 ? 'green' : '#0f0'])
        tPrev = tCur
      }
    }
  }

  extraTimeLines.selectAll('line')
    .data(extraTimes)
    .join('line')
      .attr('x1', (d) => d[0])
      .attr('x2', (d) => d[0])
      .attr('y1', 0)
      .attr('y2', 100)
      .attr('stroke', (d) => d[1])

  xAxisGenerator
    .scale(xScale)
    (xAxis)
}

function resetPan (width: number): void {
  const k = 1 / 4
  const tx = -((Date.now() - DAY_MS) * width / DAY_MS) * k
  const newTransform = new d3.ZoomTransform(k, tx, 0)
  pan.transform(viz, newTransform)
}

function panTo (t: number): void {
  pan.translateTo(viz, xScaleOrig(t), 0)
  render()
}

function panShift (hours: number): void {
  const width = xScaleOrig.range()[1]
  if (hours) {
    pan.translateBy(viz, -hours * width * HOUR_MS / DAY_MS, 0)
  } else {
    resetPan(width)
  }

  render()
}

function panNext (offset: number, data: ModData): void {
  const [a, b] = xScale.domain()
  const modulo = modEventLCM * HOUR_MS

  let toShift = (offset * HOUR_MS) - (+a % modulo)
  if (toShift < 0) toShift += modulo

  const shift = (toShift - (+b - +a - data.active_duration * HOUR_MS) / 2) / HOUR_MS
  if (!shift) return
  panShift(shift)

  const targetTime = +a + toShift
  window.alert(`Jumped to next occurrence of ${data.mod_id} at ${formatTime(targetTime)}`)
}

function resizeHandler (): void {
  const rect = chartNode!.getBoundingClientRect()
  width = rect.width
  height = rect.height

  viz
    .attr('width', width)
    .attr('height', height)

  xAxis
    .attr('transform', 'translate(0, ' + height + ')')

  // set transform such that old domain maps to new range
  const oldWidth = xScaleOrig.range()[1]
  const transform = d3.zoomTransform(viz.node()!)
  const newTransform = new d3.ZoomTransform(
    transform.k,
    transform.x * (width / oldWidth),
    transform.y,
  )

  xScaleOrig
    .range([0, width])

  pan
    .translateExtent([[xScaleOrig(MIN_TIME), 0], [xScaleOrig(MAX_TIME), 0]])
    .transform(viz, newTransform)

  // xScale should now map old domain to new range
  xScale = newTransform.rescaleX(xScaleOrig)

  render()
}

function init (): void {
  const chart = d3.select(chartNode!)

  viz = chart.append('svg')

  barGroup = viz.append('g')
  barTextGroup = viz.append('g')

  xAxis = viz.append('g')
    .classed('axis', true)
    .call(xAxisGenerator)

  curTimeLine = viz.append('line')
    .attr('y1', 0)
    .attr('y2', 100)
    .style('stroke', 'red')

  extraTimeLines = viz.append('g')

  pan(viz)
  resetPan(1)
  resizeHandler()
}

function setModEvent (m: ModEvent): void {
  modEvent = m

  const total = modEvent.infoActiveHours
  const g = modEvent.infoActiveHoursGCD24
  const periodRun = 24 / g
  const periodDay = total / g
  modEventLCM = periodRun * total

  modEventTotalText = `Total time = ${total} h, gcd(${total}, 24) = ${g} (${g} h, 1/${periodRun} d), lcm(${total}, 24) = ${modEventLCM} (${periodDay} d, ${periodRun} run)`

  modEventTimetable = []
  let modOffset = 0
  for (const mod of modEvent.info) {
    if (!mod.active) {
      modEventTimetable.push([mod, 'disabled', 'table-danger'])
      continue
    }

    if (mod.featured) {
      modEventTimetable.push([mod, 'featured', 'table-success'])
      continue
    }

    const timing: ModTiming[] = []
    for (let i = 0, offset = modOffset; i < periodRun; i++) {
      timing.push([offset, mod])
      offset += total
    }

    modEventTimetable.push([
      mod,
      timing,
    ])

    modOffset += mod.active_duration
  }
}

async function loadInfo (): Promise<void> {
  loading = true
  try {
    const resp = await fetch('https://starblast.io/modsinfo.json')
    const respJson = await resp.json()

    loadError = undefined
    useLive = true
    modHistory[1] = generateHistory(respJson[0], modDataCached)
    setModEvent(modHistory[1][0])
    render()
  } catch (e) {
    console.error(loadError = e)
  } finally {
    loading = false
  }
}

onMount(async function () {
  setModEvent(modHistory[0][0])
  init()
  return loadInfo()
})
</script>

<style>
.chart_container {
  width: 100vw;
  margin-left: calc(-50vw + 50%);
  height: 180px;
  background: #333;
  display: flex;
  align-items: center;
}

.chart {
  width: 100%;
  height: 100px;
  background: whitesmoke;
  cursor: move;
}
</style>

<svelte:window onresize={resizeHandler} />

<h2>Timeline</h2>

<div class="chart_container my-3"><div class="chart" bind:this={chartNode}></div></div>

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Navigate</span>

  <button class="w-50 btn btn-outline-secondary"
    title="Previous cycle at same time of day"
    onclick={() => panShift(-modEventLCM)}>&laquo;</button>
  <button class="w-75 btn btn-outline-secondary"
    title="Previous cycle"
    onclick={() => panShift(-modEvent!.infoActiveHours)}>&lsaquo;</button>
  <button class="w-100 btn btn-outline-secondary"
    title="Jump to current time"
    onclick={() => panShift(0)}>Reset</button>
  <button class="w-75 btn btn-outline-secondary"
    title="Next cycle"
    onclick={() => panShift(modEvent!.infoActiveHours)}>&rsaquo;</button>
  <button class="w-50 btn btn-outline-secondary"
    title="Next cycle at same time of day"
    onclick={() => panShift(modEventLCM)}>&raquo;</button>
</div>

<p>{modEventTotalText}</p>

<h2>History</h2>

<div class="btn-group my-2 d-flex">
  <span class="input-group-text">Info Source</span>
  <button class="btn btn-outline-secondary w-100" class:active={!useLive} onclick={() => (useLive = false)}>Offline (Cached)</button>
  <button class="btn btn-outline-{loading ? 'warning' : 'primary'} w-100" class:active={useLive} onclick={() => useLive ? (loading || loadInfo()) : (useLive = true)}>{loading ? '[Loading]' : 'Online'}</button>
</div>

<div class="row row-cols-md-auto g-3 align-items-center my-2">
  <div class="col-12">
    <label class="form-check">
      <input type="checkbox" class="form-check-input" bind:checked={autoHistory.value} onchange={render}>
      <span class="form-check-label">Render effective history</span>
    </label>
  </div>
  <div class="col-12">
    <label class="form-check">
      <input type="checkbox" class="form-check-input" bind:checked={showHistoryTimes.value} onchange={render}>
      <span class="form-check-label">Render history times</span>
    </label>
  </div>
  <div class="col-12">
    <div class="row row-cols-auto align-items-center">
      <div class="col">
        <label class="form-check">
          <input type="checkbox" class="form-check-input" bind:checked={showDaily.value} onchange={render}>
          <span class="form-check-label">Render daily time</span>
        </label>
      </div>
      {#if showDaily.value}
        <div class="col">
          <input type="time" class="form-control" bind:value={showDailyTime.value} onchange={render}>
        </div>
      {/if}
    </div>
  </div>
  <div class="col-12">
    <label class="form-check">
      <input type="checkbox" class="form-check-input" bind:checked={hideMinor.value}>
      <span class="form-check-label">Hide minor revisions</span>
    </label>
  </div>
    <div class="col-12">
    <label class="form-check">
      <input type="checkbox" class="form-check-input" bind:checked={showDelay.value}>
      <span class="form-check-label">Show delays between revisions</span>
    </label>
  </div>
</div>

{#if useLive && loadError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Error</h4>
    {loadError}
  </div>
{:else}
  <div class="list-group">
    {#each activeModHistory as h, i}
      {#if i && showDelay.value && activeModHistory[i - 1].time > h.time}
        <div class="list-group-item text-center">
          {formatDelay(activeModHistory[i - 1].time - h.time)}
        </div>
      {/if}
      {#if !hideMinor.value || !h.minor || modEvent === h}
        <button class="list-group-item list-group-item-action"
          class:active={modEvent === h}
          onclick={() => modEvent === h ? panTo(h.time) : (setModEvent(h), render())}>
            {h.timeStr}
            {#if h.add}
              <span class="badge text-bg-{h.mod ? 'success' : 'info'}">{h.mod ? 'add' : 'init'}</span>
              {h.mod?.mod_id ?? ''}
            {:else}
              <span class="badge text-bg-{h.prop === 'active' || h.prop === 'featured'
                  ? h.oldVal === (h.prop === 'active') ? 'danger' : 'primary'
                  : h.prop === 'active_duration'
                    ? 'warning'
                    : 'secondary'}">
                {h.prop}
              </span>
              {h.mod?.mod_id}: <code>{h.oldVal}</code> to <code>{h.mod?.[h.prop]}</code>
            {/if}
            {h.newTime ?? ''}
          </button>
        {/if}
    {/each}
  </div>
  <div class="alert alert-warning mt-2" role="alert">
    The history feature is a work-in-progress. Some events might be missing or have the wrong timestamp.
  </div>
{/if}

<h2>Timetable</h2>

<table class="table table-striped table-bordered my-2">
  <thead>
    <tr>
      <th colspan=2>Mod</th>
      <th>UTC Hours</th>
    </tr>
  </thead>
  <tbody>
    {#each modEventTimetable as [{ mod_id, title }, timings, className]}
      <tr>
        <td>{title}</td>
        <td>{mod_id}</td>
        <td class={className}>
          {#if typeof timings === 'string'}
            {timings}
          {:else}
            {#each timings as t, i}
              {#if i}, {/if}<a href="#next_{mod_id}_{t[0]}" onclick={(event) => (event.preventDefault(), panNext(...t))}>{t[0] % 24}</a>
            {/each}
          {/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>
