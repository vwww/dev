<script lang="ts">
import * as d3 from 'd3'

import { onMount } from 'svelte'
import { gcd, sum } from '@/util'

import modsinfo from './modsinfo.json'

const SB_INIT_TIME = 1479772800000
const SB_CACHE_TIME = 1668000000000
const modDataCached: ModInfo = modsinfo[0]

interface ModData {
  _id: string
  "mod_id": string
  "author": string
  "title": string
  "timesplayed"?: number
  "max_enter_players": number
  "max_enter_time": number
  "version": string
  "active": boolean
  "new": boolean
  "active_duration": number
  "featured": boolean
  date_created: number
}

const ModDataKeys = [
  '_id',
  'mod_id',
  'author',
  'title',
  'timesplayed',
  'max_enter_players',
  'max_enter_time',
  'version',
  'active',
  'new',
  'active_duration',
  'featured',
  'date_created',
] as const

type ModInfo = readonly ModData[]

type ModEventBase =
  | { add: true }
  | { add?: false, prop: keyof ModData, oldVal: unknown }

type ModEvent = ModEventBase & {
  time: number
  timeStr: string
  mod_id?: string
  info: ModInfo
}

type ModHistory = ModEvent[]

function formatTimeLocal (t: number): string {
  return new Date(t).toLocaleString()
}

function formatTimeISO (t: number): string {
  return new Date(t).toISOString().replace('.000Z', 'Z')
}

function generateHistory(raw: ModInfo, rawBase?: ModInfo): ModHistory {
  type ModEventTimed = ModEventBase & { time: number }
  type ModEventTimedSpec = ModEventTimed & { mod_id: string }

  const overrides: Partial<Record<string, ModEventTimed[]>> = {
    "useries": [{ add: true, time: 1528459800000 }],
    "battleroyale": [{ add: true, time: 1511530440000 }],
    "racing": [
      { time: 1529679300000, add: true },
      { time: 1592486063588, prop: 'active', oldVal: true },
    ],
    "prototypes": [
      { time: 1553777807000, add: true },
      { time: 1578454316626, prop: 'active', oldVal: true },
    ],
    "rumble": [
      { time: 1599209592000, add: true },
      { time: 1615100000000, prop: 'active_duration', oldVal: 8 }, // unknown timestamp
      { time: 1634902500000, prop: 'active_duration', oldVal: 6 },
    ],
    "ctf": [
      { time: 1602235325000, add: true },
      { time: 1625000000000, prop: 'active', oldVal: true }, // unknown timestamp
      { time: 1634902400000, prop: 'active', oldVal: false }, // unknown timestamp
      { time: 1634902500000, prop: 'active_duration', oldVal: 8 },
      { time: 1648729800000, prop: 'author', oldVal: '45rfew and Bhpsngum' },
    ],
    "mcst": [
      { time: 1612516370000, add: true },
      { time: 1637498700000, prop: 'active_duration', oldVal: 4 },
    ],
  }

  const rawBaseMap: Partial<Record<string, ModData>> = Object.fromEntries((rawBase ?? []).map((d) => [d.mod_id, d]))
  const events: ModEventTimedSpec[] = []
  for (const m of raw) {
    if (m.mod_id === 'none' && m.title === 'Starblast Prototypes') {
      m.mod_id = 'prototypes'
    }

    const { mod_id } = m

    const override = overrides[mod_id]
    if (override) {
      events.push(...override.map(e => ({
          ...e,
          mod_id,
        })))
    } else {
      events.push({
        add: true,
        time: m.date_created,
        mod_id,
      })
    }

    if (!m.featured) {
      events.push({
        add: false,
        time: (override?.[0].time ?? m.date_created) + 1000,
        mod_id,
        prop: 'featured',
        oldVal: true,
      })
    }

    // check for changed props
    const oldM = rawBaseMap[mod_id]
    if (oldM) {
      for (const prop of ModDataKeys) {
        if (prop === 'timesplayed') continue

        const oldVal = oldM[prop]
        if (oldVal === m[prop])  continue

        events.push({
          time: SB_CACHE_TIME,
          mod_id,
          prop,
          oldVal,
        })
      }
    }
  }

  // sort newest to oldest, reverse order of equal items if stable sort is supported
  events.sort((a, b) => a.time - b.time).reverse()

  const history: ModHistory = []
  let info: ModInfo = raw
  const curMods = Object.fromEntries(raw.map((m) => [m.mod_id, m]))

  for (const event of events) {
    const { add, time, mod_id } = event

    const data = curMods[mod_id]
    if (!add && data[event.prop] === event.oldVal) continue

    history.push({
      ...event,
      timeStr: formatTimeISO(time),
      info,
    })

    // revert event
    if (add) {
      info = info.filter((mod) => mod !== data)
    } else {
      const newData = { ...data, [event.prop]: event.oldVal }
      curMods[mod_id] = newData
      info = info.map((i) => i === data ? newData : i)
    }
  }

  history.push({
      add: true,
      time: SB_INIT_TIME,
      timeStr: formatTimeISO(SB_INIT_TIME),
      info,
    })

  return history
}

let modData: ModInfo
let modDataRotation: ModInfo
let modDataFeatured: ModInfo
let modDataTotal = 0
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
  const xScaleOrig = d3.scaleTime()
    .domain([Date.now() - 86400000, Date.now() + 86400000 * 2])

  let xScale = xScaleOrig.copy()

  const colorScale = d3.schemeCategory10

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
    interface Data {
      x: number
      y: number
      width: number
      height: number
      color: string
      label: string
      tooltip: string
    }
    const data: Data[] = []

    const [dStart, dEnd] = xScale.domain() as unknown as number[]

    const showBars = dEnd - dStart <= 7200000 * width
    const showText = dEnd - dStart <= 600000 * width
    const showTextFull = dEnd - dStart <= 150000 * width

    const firstLastColor = (modDataRotation.length % colorScale.length) === 1

    if (showBars) {
      let t = dStart - dStart % modDataTotal - (dStart < 0 ? modDataTotal : 0)
      let i = 0
      while (t < dEnd) {
        const mod = modDataRotation[i]
        const duration = mod.active_duration * 3600000
        const tEnd = t + duration

        if (tEnd > dStart) {
          const xStart = xScale(t)
          const xEnd = xScale(tEnd)

          const tooltipLines = [
            mod.title,
            formatTimeLocal(t),
            formatTimeLocal(tEnd),
            ''
          ]

          for (const k of ModDataKeys) {
            if (mod[k] !== undefined) {
              tooltipLines.push(`${k}: ${k === 'date_created' ? formatTimeLocal(mod[k]) : mod[k]}`)
            }
          }

          data.push({
            x: xStart,
            y: 0,
            width: xEnd - xStart,
            height: modDataFeatured.length ? 40 : 70,
            color: colorScale[i % colorScale.length + (firstLastColor && i + 1 === modDataRotation.length ? 1 : 0)],
            label: showText ? showTextFull ? mod.title : mod.mod_id : '',
            tooltip: tooltipLines.join('\n').trimEnd(),
          })
        }

        t += duration
        if (++i === modDataRotation.length) i = 0
      }
    } else {
      data.push({
        x: 0,
        y: 0,
        width: xScale.range()[1],
        height: modDataFeatured.length ? 40 : 70,
        color: colorScale[1],
        label: '[zoom in to see details]',
        tooltip: '',
      })
    }

    if (modDataFeatured.length) {
      data.push({
        x: 0,
        y: 40,
        width: xScale.range()[1],
        height: 30,
        color: '#555',
        label: modDataFeatured.map((m) => m.title).join(', '),
        tooltip: '',
      })
    }

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

  pan(viz)

  // Update sizes
  resizeHandler = function () {
    const rect = chart.node()!.getBoundingClientRect()
    width = rect.width
    height = rect.height

    viz
      .attr('width', width)
      .attr('height',  height)

    xAxis
      .attr('transform', 'translate(0, ' + height + ')')

    xScaleOrig
      .range([0, width])

    const s = xScale.domain().map(xScaleOrig)
    const newTransform = d3.zoomIdentity
      .scale(width / (s[1] - s[0]))
      .translate(-s[0], 0)

    pan
      .translateExtent([[xScaleOrig(MIN_TIME), 0], [xScaleOrig(MAX_TIME), 0]])
      .transform(viz, newTransform)

    const transform = d3.zoomTransform(viz.node()!)
    xScale = transform.rescaleX(xScaleOrig)

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
  modDataTotalText = `Total time = ${totalHours} h, gcd(${totalHours}, 24) = ${g}, lcm(${totalHours}, 24) = ${24 / g * totalHours} (${totalHours / g} d, ${24 / g} run)`
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
