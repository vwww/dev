<script lang="ts">
import * as d3 from 'd3'
import { onMount } from 'svelte'

interface ModInfo {
  _id: string
  "mod_id": string
  "author": string
  "title": string
  "timesplayed": number
  "max_enter_players": number
  "max_enter_time": number
  "version": string
  "active": boolean
  "new": boolean
  "active_duration": number
  "featured": boolean
  date_created: number
}

interface Data {
  t: number
  i: number
  x: number
  width: number
  data: ModInfo
  tooltip: string
}

let chartNode: HTMLDivElement
let resizeHandler: () => void

function init (modDataRaw: [ModInfo[]]) {
  const modData = modDataRaw[0].filter(m => m.active && !m.featured)
  const modDataTotal = modData.map((m) => m.active_duration).reduce((a, b) => a + b, 0) * 3600000

  const chart = d3.select(chartNode)

  // Get chart size
  let width = 100
  let height = 100

  // Create SVG
  const viz = chart.append('svg')

  const barGroup = viz.append('g')

  // Create scales
  const xScaleOrig = d3.scaleTime()
    .domain([Date.now(), Date.now() + 86400000])

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
  function render () {
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
        const duration = modData[i].active_duration * 3600000
        const tEnd = t + duration

        if (tEnd > dStart) {
          const xStart = xScale(t)
          const xEnd = xScale(tEnd)

          const tooltip = modData[i].title + '\n' +
            `${new Date(t).toLocaleString()}\n` +
            `${new Date(tEnd).toLocaleString()}\n\n` +
            `_id: ${modData[i]._id}\n` +
            `mod_id: ${modData[i].mod_id}\n` +
            `author: ${modData[i].author}\n` +
            `title: ${modData[i].title}\n` +
            `timesplayed: ${modData[i].timesplayed}\n` +
            `max_enter_players: ${modData[i].max_enter_players}\n` +
            `max_enter_time: ${modData[i].max_enter_time}\n` +
            `version: ${modData[i].version}\n` +
            `active: ${modData[i].active}\n` +
            `new: ${modData[i].new}\n` +
            `active_duration: ${modData[i].active_duration}\n` +
            `featured: ${modData[i].featured}\n` +
            `date_created: ${new Date(modData[i].date_created).toLocaleString()}`

          data.push({
            t,
            i,
            x: xStart,
            width: xEnd - xStart,
            data: modData[i],
            tooltip,
          })
        }

        t += duration
        if (++i === modData.length) i = 0
      }
    }

    barGroup.selectAll('rect')
      .data(data)
      .join('rect')
        .attr('x', (d) => d.x)
        .attr('y', 10)
        .attr('width', (d) => d.width)
        .attr('height', 70)
        .attr('fill', (d) => colorScale[d.i % colorScale.length])
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

    const transform = d3.zoomTransform(viz.node())
    xScale = transform.rescaleX(xScaleOrig)

    render()
  }

  resizeHandler()
}

onMount(async function () {
  const resp = await fetch('https://starblast.io/modsinfo.json')
  const respJson = await resp.json()
  init(respJson)
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

.chart text {
  pointer-events: none
}
</style>

<svelte:window on:resize={() => resizeHandler?.()} />

<div class="chart_container"><div class="chart" bind:this={chartNode}></div></div>
