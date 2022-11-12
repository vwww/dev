<script lang="ts">
import * as d3 from 'd3'
import { onMount } from 'svelte'
import { pStore } from '@/util/svelte'

const curAge = pStore('tool/time/ageCur', 30)
const maxAge = pStore('tool/time/ageMax', 120)

let updateCurHandler: () => void | undefined
let updateMaxHandler: () => void | undefined
let resizeHandler: () => void | undefined

let chartNodeR: HTMLDivElement
let chartNodeS: HTMLDivElement
let chartNodeL: HTMLDivElement
let chartNodeC: HTMLDivElement
let chartNodeQ: HTMLDivElement

function init () {
  const scaleR = d3.scaleLinear()
  const scaleS = d3.scaleSqrt()
  const scaleL = d3.scaleLog()
  const scaleC = d3.scalePow().exponent(1 / 3)
  const scaleQ = d3.scalePow().exponent(2)
  const colorScale = d3.schemeCategory10

  function updateHover (age: number) {
    for (const { scale, hoverLine } of charts) {
      const x = scale(age)
      hoverLine
        .attr('x1', x)
        .attr('x2', x)
    }
  }

  const charts = ([
      [chartNodeR, scaleR, 0],
      [chartNodeS, scaleS, 0],
      [chartNodeL, scaleL, 1],
      [chartNodeC, scaleC, 0],
      [chartNodeQ, scaleQ, 0],
    ] as [HTMLDivElement, d3.ScaleContinuousNumeric<number, number>, number][]).map(([chart, scale, lowerBound]) => {
      const chartD3 = d3.select(chart)
      const viz = chartD3.append('svg')
      const groupBars = viz.append('g')
      const xAxisGenerator = d3.axisBottom(scale)

      scale.domain([lowerBound, 2])

      viz.on('mousemove', (event) => updateHover(scale.invert(d3.pointer(event)[0])))

      const xAxis = viz.append('g')
        .classed('axis', true)
        .attr('transform', 'translate(0, 30)')
        .call(xAxisGenerator)

      return {
        chart,
        scale,
        lowerBound,
        chartD3,
        viz,
        groupBars,
        xAxisGenerator,
        xAxis,
        ageLine: viz.append('line')
          .attr('y1', 0)
          .attr('y2', 100)
          .style('stroke', 'red'),
        hoverLine: viz.append('line')
          .attr('y1', 0)
          .attr('y2', 100)
          .style('stroke', 'black')
      }
    })

  updateCurHandler = function () {
    for (const { scale, ageLine } of charts) {
      const x = scale($curAge)
      ageLine
        .attr('x1', x)
        .attr('x2', x)
    }
  }

  updateMaxHandler = function () {
    const years = [...Array($maxAge).keys()]

    for (const { scale, lowerBound, groupBars, xAxisGenerator, xAxis } of charts) {
      scale.domain([scale.domain()[0], $maxAge])

      xAxisGenerator
        .scale(scale)
        (xAxis)

      groupBars.selectAll('rect')
        .data(years.slice(lowerBound))
        .join('rect')
          .attr('x', (d) => scale(d))
          .attr('y', 10)
          .attr('width', (d) => scale(d + 1) - scale(d))
          .attr('height', 20)
          .attr('fill', (d) => colorScale[d % colorScale.length])
    }

    updateCurHandler()
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

    updateMaxHandler()
  }

  resizeHandler()
}

onMount(init)
</script>

<style>
.chart {
  width: 100%;
  height: 50px;
  background: #eee;
  display: flex;
  align-items: center;
}
</style>

<svelte:window on:resize={() => resizeHandler?.()} />

<div class="row">
  <div class="col-sm-6 mb-1">
    <div class="input-group">
      <span class="input-group-text">Current Age: </span>
      <input type="number" class="form-control" bind:value={$curAge} min="1" on:change={() => updateCurHandler?.()}>
    </div>
  </div>
  <div class="col-sm-6 mb-3">
    <div class="input-group">
      <span class="input-group-text">Max Age: </span>
      <input type="number" class="form-control" bind:value={$maxAge} min="1" on:change={() => updateMaxHandler?.()}>
    </div>
  </div>
</div>

<h1>Real Time</h1>
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
