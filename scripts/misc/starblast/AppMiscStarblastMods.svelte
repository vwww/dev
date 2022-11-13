<script lang="ts">
import * as d3 from 'd3'

import { onMount } from 'svelte'
import { gcd, sum } from '@/util'

import modDataCached from './modsinfo.json'

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

type ModInfo = readonly ModData[]

const enum ModEventType {
  Add,
  Modify,
  Remove,
  Initial,
}

type ModEventBase =
  | { type: ModEventType.Add | ModEventType.Remove | ModEventType.Initial }
  | { type: ModEventType.Modify, prop: keyof ModData, oldVal: unknown }

type ModEvent = ModEventBase & {
  time: number
  timeStr: string
  mod_id: string
  info: ModInfo
}

type ModHistory = ModEvent[]

function generateHistory(raw: ModInfo): ModHistory {
  type ModEventTimed = ModEventBase & { time: number }
  type ModEventTimedSpec = ModEventTimed & { mod_id: string }

  const overrides: Partial<Record<string, ModEventTimed[]>> = {
    "useries": [{ type: ModEventType.Add, time: 1528459800000 }],
    "battleroyale": [{ type: ModEventType.Add, time: 1511530440000 }],
    "racing": [
      { time: 1529679300000, type: ModEventType.Add },
      { time: 1592486063588, type: ModEventType.Remove },
    ],
    "prototypes": [
      { time: 1553777807000, type: ModEventType.Add },
      { time: 1578454316626, type: ModEventType.Remove },
    ],
    "rumble": [
      { time: 1599209592000, type: ModEventType.Add },
      { time: 1615100000000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 8 }, // unknown timestamp
      { time: 1634902500000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 6 },
      { time: 1668000000000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 8 },
    ],
    "ctf": [
      { time: 1602235325000, type: ModEventType.Add },
      { time: 1625000000000, type: ModEventType.Remove }, // unknown timestamp
      { time: 1634902400000, type: ModEventType.Add }, // unknown timestamp
      { time: 1634902500000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 8 },
      { time: 1648729800000, type: ModEventType.Modify, prop: 'author', oldVal: '45rfew and Bhpsngum' },
      { time: 1668000000000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 4 },
    ],
    "mcst": [
      { time: 1612516370000, type: ModEventType.Add },
      { time: 1637498700000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 4 },
      { time: 1668000000000, type: ModEventType.Modify, prop: 'active_duration', oldVal: 8 },
    ],
  }

  const events: ModEventTimedSpec[] = raw.flatMap((m) => {
    if (m.mod_id === 'none' && m.title === 'Starblast Prototypes') {
      m.mod_id = 'prototypes'
    }

    const override = overrides[m.mod_id]
    if (override || m.active && !m.featured) {
      return (override || [{ type: ModEventType.Add, time: m.date_created }])
        .map(e => ({
          ...e,
          mod_id: m.mod_id,
        }))
    }

    return []
  })

  // sort newest to oldest, reverse order of equal items if stable sort is supported
  events.sort((a, b) => a.time - b.time).reverse()

  const history: ModHistory = []
  let info: ModInfo = raw.filter((m) => m.active && !m.featured)
  const curMods = Object.fromEntries(raw.map((m) => [m.mod_id, m]))
  const origIndex = Object.fromEntries(raw.map((m, i) => [m.mod_id, i]))

  for (const event of events) {
    const { type, time, mod_id } = event

    const data = curMods[mod_id]
    if (type === ModEventType.Modify && data[event.prop] === event.oldVal) continue

    history.push({
      ...event,
      timeStr: new Date(time).toISOString(),
      info,
    })

    // revert event
    switch (type) {
      case ModEventType.Add:
        info = info.filter((mod) => mod !== data)
        break
      case ModEventType.Remove:
        let insertIndex = 0
        while (insertIndex < info.length && origIndex[info[insertIndex].mod_id] < origIndex[mod_id]) insertIndex++
        info = [...info.slice(0, insertIndex), data, ...info.slice(insertIndex)]
        break
      case ModEventType.Modify:
        const newData = { ...data, [event.prop]: event.oldVal }
        curMods[mod_id] = newData
        info = info.map((i) => i === data ? newData : i)
        break
    }
  }

  const SB_INIT_TIME = 1479772800000
  history.push({
      type: ModEventType.Initial,
      time: SB_INIT_TIME,
      timeStr: new Date(SB_INIT_TIME).toISOString(),
      mod_id: '',
      info,
    })

  return history
}

function formatTime (t: number): string {
  return new Date(t).toLocaleString()
}

let modData: ModInfo
let modDataTotal = 0
let modDataTotalText = ''
let modHistory = [generateHistory((modDataCached as unknown as [ModInfo])[0])]
let useLive = false
let loadError: unknown = 'loading'

let chartNode: HTMLDivElement
let render: () => void
let resizeHandler: () => void

function init () {
  const chart = d3.select(chartNode)

  // Get chart size
  let width = 100
  let height = 100

  // Create SVG
  const viz = chart.append('svg')

  const barGroup = viz.append('g')

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
      t: number
      i: number
      x: number
      width: number
      data: ModData
      tooltip: string
    }
    const data: Data[] = []

    const dStart = xScale.domain()[0] as unknown as number
    const dEnd = xScale.domain()[1] as unknown as number

    const showBars = dEnd - dStart <= 7200000 * width
    const showText = dEnd - dStart <= 600000 * width
    const showTextFull = dEnd - dStart <= 150000 * width

    if (showBars) {
      let t = dStart - dStart % modDataTotal - (dStart < 0 ? modDataTotal : 0)
      let i = 0
      while (t < dEnd) {
        const mod = modData[i]
        const duration = mod.active_duration * 3600000
        const tEnd = t + duration

        if (tEnd > dStart) {
          const xStart = xScale(t)
          const xEnd = xScale(tEnd)

          const tooltipLines = [
            mod.title,
            formatTime(t),
            formatTime(tEnd),
            ''
          ]

          for (const k of [
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
          ] as const) {
            if (mod[k] !== undefined) {
              tooltipLines.push(`${k}: ${k === 'date_created' ? formatTime(mod[k]) : mod[k]}`)
            }
          }

          data.push({
            t,
            i,
            x: xStart,
            width: xEnd - xStart,
            data: mod,
            tooltip: tooltipLines.join('\n'),
          })
        }

        t += duration
        if (++i === modData.length) i = 0
      }
    }

    const firstLastColor = (modData.length % colorScale.length) === 1

    barGroup.selectAll('rect')
      .data(data)
      .join('rect')
        .attr('x', (d) => d.x)
        .attr('y', 10)
        .attr('width', (d) => d.width)
        .attr('height', 70)
        .attr('fill', (d) => {
          const i = d.i % colorScale.length + (firstLastColor && d.i + 1 === modData.length ? 1 : 0)
          return colorScale[i]
        })
        // .attr('stroke', 'rgba(0,0,0,0.3)')
        // .attr('stroke-width', 4)
        // .attr('stroke-dasharray', (d) => `70,${d.width}`)
        // .attr('stroke-dashoffset', 70)
      .selectAll('title')
        .data((d) => [d])
        .join('title')
        .text((d) => d.tooltip)

    barGroup.selectAll('text')
      .data(showText ? data : [])
      .join('text')
        .text((d) => showTextFull ? d.data.title : d.data.mod_id)
        .attr('x', (d) => (Math.max(d.x, 0) + Math.min(d.x + d.width, width)) / 2)
        .attr('y', 50)
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
  const MIN_TIME = +new Date('-010001-12-31T00:00Z')
  const MAX_TIME = +new Date('+010000-01-02T00:00Z')
  const pan = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([86400000 / (MAX_TIME - MIN_TIME), Number.POSITIVE_INFINITY])
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
  const totalHours = sum(modData.map((m) => m.active_duration))
  modDataTotal = totalHours * 3600000

  const g = gcd(totalHours, 24, 0, 24)
  modDataTotalText = `Total time = ${totalHours} h, gcd(${totalHours}, 24) = ${g}, lcm(${totalHours}, 24) = ${24 / g * totalHours} (${totalHours / g} d, ${24 / g} run)`
}

onMount(async function () {
  setModData(modHistory[0][0].info)
  init()

  try {
    const resp = await fetch('https://starblast.io/modsinfo.json')
    const respJson = await resp.json()

    loadError = undefined
    useLive = true
    setModData((modHistory[1] = generateHistory(respJson[0]))[0].info)
    render()
  } catch (e) {
    console.error(loadError = e)
  }
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
  <button class="btn btn-outline-primary w-100" class:active={useLive} on:click={() => useLive = true}>Online</button>
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
          {#if modInfo.type === ModEventType.Add}
            <span class="badge bg-success">add</span>
            {modInfo.mod_id}
          {:else if modInfo.type === ModEventType.Modify}
            <span class={`badge bg-${modInfo.prop === 'active_duration' ? 'warning' : 'secondary'}`}>
              modify
            </span>
            {modInfo.mod_id}/{modInfo.prop} from <code>{modInfo.oldVal}</code> to <code>{modInfo.info.filter(m => m.mod_id === modInfo.mod_id)[0]?.[modInfo.prop] ?? '(unknown)'}</code>
          {:else if modInfo.type === ModEventType.Remove}
            <span class="badge bg-danger">del</span>
            {modInfo.mod_id}
          {:else}
            <span class="badge bg-info">empty</span>
          {/if}
        </button>
    {/each}
  </div>
  <div class="alert alert-warning mt-2" role="alert">
    The history feature is a work-in-progress and might be missing some events.
  </div>
{/if}
