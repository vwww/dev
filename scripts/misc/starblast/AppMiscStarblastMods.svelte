<script lang="ts">
import * as d3 from 'd3'

import { onMount } from 'svelte'
import { gcd, sum } from '@/util'

import { generateHistory } from './history'
import { generateData, ModInfo } from './modinfo'
import modsinfo from './modsinfo.json'

const modDataCached: ModInfo = modsinfo[0]

let modData: ModInfo
let modDataRotation: ModInfo
let modDataFeatured: ModInfo
let modDataTotal = 0
let modDataPeriod = 0
let modDataTotalText = ''
let modHistory = [generateHistory(modDataCached)]
let useLive = false
let loading = false
let loadError: unknown = 'loading'

const MIN_TIME = +new Date('-010001-12-31T00:00Z')
const MAX_TIME = +new Date('+010000-01-02T00:00Z')

let chartNode: HTMLDivElement
let viz: d3.Selection<SVGSVGElement, unknown, null, undefined>
let pan: d3.ZoomBehavior<SVGSVGElement, unknown>
let render: () => void
let panShift: (n: number) => void
let resizeHandler: () => void

function init () {
  const chart = d3.select(chartNode)

  // Get chart size
  let width = 100
  let height = 100

  // Create SVG
  viz = chart.append('svg')

  const barGroup = viz.append('g')
  const barTextGroup = viz.append('g')

  // Create scales
  const xScaleOrig = d3.scaleTime().domain([0, 86400000])

  let xScale = xScaleOrig.copy()

  // X-axis
  const xAxisGenerator = d3.axisTop(xScale)

  const xAxis = viz.append('g')
    .classed('axis', true)
    .call(xAxisGenerator)

  // Current time line
  const curTimeLine = viz.append('line')
    .attr('y1', 0)
    .attr('y2', 100)
    .style('stroke', 'red')

  // Bar generator
  render = function () {
    const [dStart, dEnd] = xScale.domain() as unknown as number[]

    const data = generateData(
      dStart, dEnd, width,
      modDataRotation, modDataTotal, modDataFeatured,
      xScale,
    )

    barGroup.selectAll('rect')
      .data(data)
      .join('rect')
        .attr('x', (d) => d.x)
        .attr('y', (d) => d.y + 10)
        .attr('width', (d) => d.width)
        .attr('height', (d) => d.height)
        .attr('fill', (d) => d.color)
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
        .style('pointer-events', 'none')

    const xNow = xScale(Date.now())
    curTimeLine
      .attr('x1', xNow)
      .attr('x2', xNow)

    xAxisGenerator
      .scale(xScale)
      (xAxis)
  }

  // Zoom/Pan behavior
  pan = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([86400000 / (MAX_TIME - MIN_TIME), Infinity])
    .on('zoom', function (e) {
      xScale = e.transform.rescaleX(xScaleOrig)
      render()
    })

  function resetPan (width: number) {
    const k = 1 / 4
    const tx = -((Date.now() - 86400000) * width / 86400000) * k
    const newTransform = new d3.ZoomTransform(k, tx, 0)
    pan.transform(viz, newTransform)
  }

  pan(viz)
  resetPan(1)

  panShift = function (s: number) {
    const width = xScaleOrig.range()[1]
    if (s) {
      pan.translateBy(viz, -s * width * modDataTotal / 86400000, 0)
    } else {
      resetPan(width)
    }

    render()
  }

  // Update sizes
  resizeHandler = function () {
    const rect = chartNode.getBoundingClientRect()
    width = rect.width
    height = rect.height

    viz
      .attr('width', width)
      .attr('height',  height)

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

  resizeHandler()
}

function setModData (m: ModInfo) {
  modData = m
  modDataRotation = modData.filter((d) => d.active && !d.featured)
  modDataFeatured = modData.filter((d) => d.active && d.featured)

  const totalHours = sum(modDataRotation.map((m) => m.active_duration))
  modDataTotal = totalHours * 3600000

  const g = gcd(totalHours, 24, 0, 24)
  const lcm = 24 / g * totalHours
  const modDataPeriodDay = totalHours / g
  modDataPeriod = 24 / g
  modDataTotalText = `Total time = ${totalHours} h, gcd(${totalHours}, 24) = ${g}, lcm(${totalHours}, 24) = ${lcm} (${modDataPeriodDay} d, ${modDataPeriod} run)`
}

async function loadInfo () {
  loading = true
  try {
    const resp = await fetch('https://starblast.io/modsinfo.json')
    const respJson = await resp.json()

    loadError = undefined
    useLive = true
    setModData((modHistory[1] = generateHistory(respJson[0], modDataCached))[0].info)
    render()
  } catch (e) {
    console.error(loadError = e)
  } finally {
    loading = false
  }
}

onMount(async function () {
  setModData(modHistory[0][0].info)
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

<svelte:window on:resize={() => resizeHandler?.()} />

<div class="chart_container mb-3"><div class="chart" bind:this={chartNode}></div></div>

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Navigate</span>

  <button class="w-50 btn btn-outline-secondary"
    on:click={() => panShift(-modDataPeriod)}>&laquo;</button>
  <button class="w-75 btn btn-outline-secondary"
    on:click={() => panShift(-1)}>&lsaquo;</button>
  <button class="w-100 btn btn-outline-secondary"
    on:click={() => panShift(0)}>Reset</button>
  <button class="w-75 btn btn-outline-secondary"
    on:click={() => panShift(1)}>&rsaquo;</button>
  <button class="w-50 btn btn-outline-secondary"
    on:click={() => panShift(modDataPeriod)}>&raquo;</button>
</div>

<p>{modDataTotalText}</p>

<div class="btn-group mb-2 d-flex">
  <span class="input-group-text">Info Source</span>
	<button class="btn btn-outline-secondary w-100" class:active={!useLive} on:click={() => useLive = false}>Offline (Cached)</button>
  <button class="btn btn-outline-{loading ? 'warning' : 'primary'} w-100" class:active={useLive} on:click={() => useLive ? (loading || loadInfo()) : useLive = true}>{loading ? '[Loading]' : 'Online'}</button>
</div>

{#if useLive && loadError}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Error</h4>
    {loadError}
  </div>
{:else}
  <div class="list-group">
    {#each modHistory[useLive ? 1 : 0] as modInfo}
      <button class="list-group-item list-group-item-action"
        class:active={modData === modInfo.info}
        on:click={() => (setModData(modInfo.info), render())}>
          {modInfo.timeStr}
          {#if modInfo.add}
            <span class="badge bg-{modInfo.mod_id ? 'success' : 'info'}">{modInfo.mod_id ? 'add' : 'init'}</span>
            {modInfo.mod_id ?? ''}
          {:else}
            <span class="badge bg-{modInfo.prop === 'active' || modInfo.prop === 'featured'
                ? modInfo.oldVal == (modInfo.prop === 'active') ? 'danger' : 'primary'
                : modInfo.prop === 'active_duration'
                  ? 'warning'
                  : 'secondary'}">
              {modInfo.prop}
            </span>
            {modInfo.mod_id}: <code>{modInfo.oldVal}</code> to <code>{modInfo.info.filter(m => m.mod_id === modInfo.mod_id)[0]?.[modInfo.prop]}</code>
          {/if}
        </button>
    {/each}
  </div>
  <div class="alert alert-warning mt-2" role="alert">
    The history feature is a work-in-progress and might be missing some events.
  </div>
{/if}
