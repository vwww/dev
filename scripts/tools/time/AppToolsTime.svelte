<script lang="ts">
import * as d3 from 'd3'
import { onMount } from 'svelte'
import { pState } from '@/util/svelte.svelte'

const curAge = pState('tool/time/ageCur', 30)
const maxAge = pState('tool/time/ageMax', 120)

let updateCurHandler: (() => void) | undefined = $state()
let updateMaxHandler: (() => void) | undefined = $state()
let resizeHandler: (() => void) | undefined = $state()

let chartNodeR: HTMLDivElement | undefined = $state()
let chartNodeS: HTMLDivElement | undefined = $state()
let chartNodeL: HTMLDivElement | undefined = $state()
let chartNodeC: HTMLDivElement | undefined = $state()
let chartNodeQ: HTMLDivElement | undefined = $state()

function scaleChecked (scale: d3.ScaleContinuousNumeric<number, number, never>, val: number): number {
  return val < scale.domain()[0] ? -1 : scale(val)
}

function init () {
  const scaleR = d3.scaleLinear()
  const scaleS = d3.scaleSqrt()
  const scaleL = d3.scaleLog()
  const scaleC = d3.scalePow().exponent(1 / 3)
  const scaleQ = d3.scalePow().exponent(2)
  const colorScale = d3.schemeCategory10

  function updateHover (age: number) {
    for (const { scale, hoverLineTop, hoverLine } of charts) {
      const xR = scaleR(age)
      const x = scaleChecked(scale, age)
      hoverLineTop
        .attr('x1', xR)
        .attr('x2', xR)
      hoverLine
        .attr('x1', x)
        .attr('x2', x)
    }
  }

  const xAxisGenerator0 = d3.axisTop(scaleR)

  const charts = ([
      [chartNodeR, scaleR, 0],
      [chartNodeS, scaleS, 0],
      [chartNodeL, scaleL, 1],
      [chartNodeC, scaleC, 0],
      [chartNodeQ, scaleQ, 0],
    ] as [HTMLDivElement, d3.ScaleContinuousNumeric<number, number>, number][]).map(([chart, scale, lowerBound]) => {
      const chartD3 = d3.select(chart)
      const viz = chartD3.append('svg')
      const xAxisGenerator1 = d3.axisBottom(scale)

      scale.domain([lowerBound, 2])

      viz.on('mousemove', (event) => {
        const [mx, my] = d3.pointer(event)
        updateHover((my < 40 ? scaleR : scale).invert(mx))
      })

      return {
        chart,
        scale,
        lowerBound,
        chartD3,
        viz,
        groupBars: viz.append('g'),
        lineChart0: viz.append('path'),
        lineChart1: viz.append('path'),
        xAxisGenerator0,
        xAxisTop: viz.append('g')
          .classed('axis', true)
          .attr('transform', 'translate(0, 20)')
          .call(xAxisGenerator0),
        xAxisGenerator1,
        xAxis: viz.append('g')
          .classed('axis', true)
          .attr('transform', 'translate(0, 60)')
          .call(xAxisGenerator1),
        ageLineTop: viz.append('line')
          .attr('y1', 0)
          .attr('y2', 40)
          .style('stroke', 'red'),
        hoverLineTop: viz.append('line')
          .attr('y1', 0)
          .attr('y2', 40)
          .style('stroke', 'black'),
        ageLine: viz.append('line')
          .attr('y1', 40)
          .attr('y2', 80)
          .style('stroke', 'red'),
        hoverLine: viz.append('line')
          .attr('y1', 40)
          .attr('y2', 80)
          .style('stroke', 'black'),
      }
    })

  updateCurHandler = function () {
    for (const { scale, ageLineTop, ageLine } of charts) {
      const xR = scaleR(curAge.value)
      const x = scaleChecked(scale, curAge.value)
      ageLineTop
        .attr('x1', xR)
        .attr('x2', xR)
      ageLine
        .attr('x1', x)
        .attr('x2', x)
    }
  }

  updateMaxHandler = function () {
    const years = [...Array(maxAge.value).keys()]

    for (const { scale, lowerBound, groupBars, lineChart0, lineChart1, xAxisTop, xAxisGenerator1, xAxis } of charts) {
      scale.domain([lowerBound, maxAge.value])

      const width = scale.range()[1]
      const skip = scaleR(lowerBound)

      const lineChartDatum0 = Array.from({ length: Math.floor(width + 1 - skip) }, (_, i) => [skip + i, 40 - 20 * scale(scaleR.invert(skip + i)) / width])
      const lineChartDatum1 = Array.from({ length: Math.floor(width + 1) }, (_, i) => [i, 60 - 20 * scale.invert(i) / maxAge.value])

      lineChart0
        .datum(lineChartDatum0)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line())

      lineChart1
        .datum(lineChartDatum1)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 1.5)
        .attr('d', d3.line())

      xAxisGenerator0
        .scale(scaleR)
        (xAxisTop)

      xAxisGenerator1
        .scale(scale)
        (xAxis)

      groupBars.selectAll('rect')
        .data(years.slice(lowerBound))
        .join('rect')
          .attr('x', (d) => scale(d))
          .attr('y', 40)
          .attr('width', (d) => scale(d + 1) - scale(d))
          .attr('height', 20)
          .attr('fill', (d) => colorScale[d % colorScale.length])
    }

    updateCurHandler?.()
  }

  resizeHandler = function () {
    for (const { chart, scale, viz } of charts) {
      const rect = chart.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      scale.range([0, width])

      viz
        .attr('width', width)
        .attr('height',  height)
    }

    updateMaxHandler?.()
  }

  resizeHandler()
}

onMount(init)
</script>

<style>
.chart {
  width: 100%;
  height: 80px;
  background: #eee;
  display: flex;
  align-items: center;
}
</style>

<svelte:window onresize={() => resizeHandler?.()} />

<div class="row">
  <div class="col-sm-6 mb-1">
    <div class="input-group">
      <span class="input-group-text">Current Age: </span>
      <input type="number" class="form-control" bind:value={curAge.value} min="0" onchange={() => updateCurHandler?.()}>
    </div>
  </div>
  <div class="col-sm-6 mb-3">
    <div class="input-group">
      <span class="input-group-text">Max Age: </span>
      <input type="number" class="form-control" bind:value={maxAge.value} min="1" onchange={() => updateMaxHandler?.()}>
    </div>
  </div>
</div>

<h1>Real Time (Linear)</h1>
<p>This is a linear scale, representing real time.</p>
<div class="chart" bind:this={chartNodeR}></div>

<h1>Subjective Time (Square Root)</h1>
<p>This scale shows subjective time through a square root scale. This is the model that Lemlich proposes.</p>
<div class="chart" bind:this={chartNodeS}></div>

<h1>Subjective Time (Logarithmic)</h1>
<p>This scale shows subjective time through a logarithmic scale, with the first year omitted. This is a model that Lemlich compares against.</p>
<div class="chart" bind:this={chartNodeL}></div>

<h1>Alternate Scales</h1>
<p>Here, we show some other scales.</p>

<h2>Cube Root</h2>
<div class="chart" bind:this={chartNodeC}></div>

<h2>Quadratic</h2>
<div class="chart" bind:this={chartNodeQ}></div>
