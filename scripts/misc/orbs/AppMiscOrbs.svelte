<script lang="ts">
import { clamp } from '@/util'
import { pState } from '@/util/svelte.svelte'
import { onMount } from 'svelte'
import { nonpassive } from 'svelte/legacy'
import * as d from 'decoders'

const NUM_ORBS = 24
const TAU = 2 * Math.PI
const MAX_TIME_S = 600

const COLORS = ['#dc143c', '#da70d6', '#6666cd', '#00bfff', '#00ff7f', '#ee0', '#ff9912', '#c67171']

const orbs = pState('misc/orbs/orbs', [] as Orb[])
const drawPaths = pState('misc/orbs/drawPaths', true)
const drawPathDuration = pState('misc/orbs/drawPathDuration', 8)
const modeV = pState('misc/orbs/modeV', 1)
const modeA = pState('misc/orbs/modeA', 1)

let selectedOrb = -1

let importExportText = $state('')

let canvas: HTMLCanvasElement = $state()!
let context: CanvasRenderingContext2D | null
let playing = $state(0)
let playStartTime = Date.now()
let pauseTime = Date.now()

let tableTime = $state(0)

type Vec2 = [x: number, y: number]

const OrbitDist = d.object({
  distX: d.number,
  distYMin: d.number,
  distYRange: d.number,
  baseDistYCycleAng: d.number,
  distYChangeSpeed: d.number,
})
type OrbitDist = d.DecoderType<typeof OrbitDist>

const Orb = d.object({
  orbitDist: OrbitDist,
  orbitBaseAng: d.number,
  _protected: d.optional(d.boolean),
})
type Orb = d.DecoderType<typeof Orb>

const OrbExport = d.object({
  orbs: d.array(Orb)
})

function jsonImport (): void {
  try {
    const orbExportRaw: unknown = JSON.parse(importExportText)
    const orbExport = OrbExport.verify(orbExportRaw, d.formatShort)
    orbs.value = orbExport.orbs
    selectedOrb = -1
  } catch (e) {
    alert(e)
  }
}

function jsonExport (): void {
  importExportText = JSON.stringify({ orbs: orbs.value })
}

function calcPosAtGameTime (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  const theta = orbitBaseAng - t / 15
  const distYFrac = Math.abs(Math.cos(orbitDist.baseDistYCycleAng + orbitDist.distYChangeSpeed * t))
  const distY = orbitDist.distYMin + orbitDist.distYRange * distYFrac

  return [
    orbitDist.distX * Math.cos(theta),
    distY * Math.sin(theta)
  ]
}

function vel (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  const theta = orbitBaseAng - t / 15
  const theta2 = orbitDist.baseDistYCycleAng + orbitDist.distYChangeSpeed * t
  const cosTheta2 = Math.cos(theta2)
  const distYFrac = Math.abs(cosTheta2)
  const distY = orbitDist.distYMin + orbitDist.distYRange * distYFrac
  const distY_ = -orbitDist.distYRange * Math.sign(cosTheta2) * Math.sin(theta2) * orbitDist.distYChangeSpeed

  return [
    orbitDist.distX * Math.sin(theta) / 15,
    distY * Math.cos(theta) / -15 + Math.sin(theta) * distY_
  ]
}

function accel (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  const theta = orbitBaseAng - t / 15
  const theta2 = orbitDist.baseDistYCycleAng + orbitDist.distYChangeSpeed * t
  const cosTheta2 = Math.cos(theta2)
  const distYFrac = Math.abs(cosTheta2)
  const distY = orbitDist.distYMin + orbitDist.distYRange * distYFrac
  const distY_ = -orbitDist.distYRange * Math.sign(cosTheta2) * Math.sin(theta2) * orbitDist.distYChangeSpeed
  const distY__ = -orbitDist.distYRange * distYFrac * orbitDist.distYChangeSpeed

  return [
    orbitDist.distX * Math.cos(theta) / -225,
    distY_ * Math.cos(theta) * 2 / -15 + distY * Math.sin(theta) / -225 + Math.sin(theta) * distY__
  ]
}

function vecSubtract (a: Vec2, b: Vec2): Vec2 {
  return [a[0] - b[0], a[1] - b[1]]
}

function velApprox (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  return vecSubtract(
    calcPosAtGameTime(orbitDist, orbitBaseAng, t + 0.5),
    calcPosAtGameTime(orbitDist, orbitBaseAng, t - 0.5),
  )
}

function accelApprox (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  return vecSubtract(
    velApprox(orbitDist, orbitBaseAng, t + 0.5),
    velApprox(orbitDist, orbitBaseAng, t - 0.5),
  )
}

function velApproxError (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  return vecSubtract(
    velApprox(orbitDist, orbitBaseAng, t),
    vel(orbitDist, orbitBaseAng, t),
  )
}

function accelApproxError (orbitDist: OrbitDist, orbitBaseAng: number, t: number): Vec2 {
  return vecSubtract(
    accelApprox(orbitDist, orbitBaseAng, t),
    accel(orbitDist, orbitBaseAng, t),
  )
}

function randomize() {
  orbs.value = Array.from({ length: NUM_ORBS }, (_, i) => ({
    orbitDist: {
      distX: 1200 + 1000 * Math.random() | 0,
      baseDistYCycleAng: TAU * Math.random(),
      distYMin: 499.98 + (1314.6 - 499.98) * Math.random(), // ? unknown distribution
      distYRange: 103.464 + (775 - 103.464) * Math.random(), // ? unknown distribution
      distYChangeSpeed: 0.01 + 0.01 * Math.random(),
    },
    orbitBaseAng: i * TAU / NUM_ORBS,
  }))
  selectedOrb = -1
  renderIfNotPlaying()
}

function playStart () {
  if (playing) return

  playStartTime = Date.now() - (pauseTime - playStartTime)

  function renderLoop () {
    playing = requestAnimationFrame(renderLoop)

    renderCanvas()
  }
  renderLoop()
}

function playStop () {
  cancelAnimationFrame(playing)
  pauseTime = Date.now()
  playing = 0
  renderCanvas()
}

function updateCanvasSize () {
  canvas.width = Math.floor(canvas.clientWidth * window.devicePixelRatio)
  canvas.height = Math.floor(canvas.clientHeight * window.devicePixelRatio)
}

function renderCircle (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.closePath()
  ctx.fill()
}

function renderArrow (ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, headLen: number, headAng = Math.PI / 6) {
  const angle = Math.atan2(y1 - y0, x1 - x0)
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.lineTo(x1, y1)
  ctx.lineTo(x1 - headLen * Math.cos(angle - headAng), y1 - headLen * Math.sin(angle - headAng))
  ctx.moveTo(x1, y1)
  ctx.lineTo(x1 - headLen * Math.cos(angle + headAng), y1 - headLen * Math.sin(angle + headAng))
  ctx.closePath()
  ctx.stroke()
}

let renderT = 0
function renderCanvas () {
  const ctx = context
  if (!ctx) return playStop()

  renderT = dragging ? dragTime : ((playing ? Date.now() : pauseTime) - playStartTime) / 1000

  const { width, height } = canvas

  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(0, 0, width, height)

  const scale = width / 8000
  const arrowLength = 64 * scale
  const px = width / 2 / scale
  const py = height / 2 / scale

  // render background grid
  ctx.lineWidth = 2
  ctx.strokeStyle = '#0e0e0e'
  for (let x = (-5 * width) % 500 - 500; x <= width + 1; x += 500) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = (-5 * height) % 500 - 500; y <= height + 1; y += 500) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.lineWidth = 1
  ctx.strokeStyle = '#2b2b2b'
  for (let x = (-5 * width) % 500 - 25.5; x <= width + 1; x += 50) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = (-5 * height) % 50 - 25.5; y <= height + 1; y += 50) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  // sun: 320x320, scale 1/2 -> radius 80
  ctx.fillStyle = '#ff0'
  renderCircle(ctx, 0.5 * width, 0.5 * height, 80 * scale)

  if (drawPaths.value) {
    const PATH_PARTS = 512

    const tBase = renderT - drawPathDuration.value / 2
    ctx.strokeStyle = '#777'
    orbs.value.forEach((orb) => {
      ctx.beginPath()
      for (let i = 0; i <= PATH_PARTS; i++) {
        const [x, y] = calcPosAtGameTime(orb.orbitDist, orb.orbitBaseAng, tBase + i * drawPathDuration.value / PATH_PARTS)
        ctx[i ? 'lineTo' : 'moveTo']((x + px) * scale, (y + py) * scale)
      }
      ctx.stroke()
    })
  }

  orbs.value.forEach((orb, i) => {
    // orb: 150x150, scale 1/3 -> radius 25
    // orbShield: 214x214, scale 1/3 -> radius 35+2/3
    // orbSelectionMarker: 214x214, 16 dots, scale 1/3 -> radius 35+2/3

    const [x, y] = calcPosAtGameTime(orb.orbitDist, orb.orbitBaseAng, renderT)

    const owner = i % 3 ? -1 : +'04361527'[i / 3]
    ctx.fillStyle = owner < 0 ? '#aaa' : COLORS[owner]
    const ox = (x + px) * scale
    const oy = (y + py) * scale
    const ORB_RAD = 25
    const ORB_SHIELD_RAD = 35 + 2/3
    // orb
    renderCircle(ctx, ox, oy, ORB_RAD * scale)
    // orb shield
    if (orb._protected) {
      ctx.globalAlpha = 0.75
      renderCircle(ctx, ox, oy, ORB_SHIELD_RAD * scale)
      ctx.globalAlpha = 1
    }
    // orb selection marker
    if (selectedOrb == i) {
      ctx.fillStyle = '#fff'
      const SELECTION_ORBS = 16
      const SELECTION_ORB_RAD = 4.5
      const SELECTION_ORB_OFFSET = ORB_SHIELD_RAD - SELECTION_ORB_RAD
      for (let j = 0; j < SELECTION_ORBS; j++) {
        const angle = (j / SELECTION_ORBS) * TAU + renderT / 2
        renderCircle(ctx,
          ox + SELECTION_ORB_OFFSET * Math.cos(angle) * scale,
          oy + SELECTION_ORB_OFFSET * Math.sin(angle) * scale,
          SELECTION_ORB_RAD * scale)
      }
    }

    // velocity vector arrow
    if (modeV.value) {
      const [vx, vy] = [vel, velApprox, velApproxError][modeV.value - 1](orb.orbitDist, orb.orbitBaseAng, renderT)
      const SCALE_VECTOR = modeV.value >= 3 ? 16384 : 4
      ctx.strokeStyle = '#00f'
      renderArrow(
        ctx,
        (x + px) * scale,
        (y + py) * scale,
        (x + vx * SCALE_VECTOR + px) * scale,
        (y + vy * SCALE_VECTOR + py) * scale,
        arrowLength,
      )
    }
    // acceleration vector arrow
    if (modeA.value) {
      const [ax, ay] = [accel, accelApprox, accelApproxError][modeA.value - 1](orb.orbitDist, orb.orbitBaseAng, renderT)
      const SCALE_VECTOR = modeA.value >= 3 ? 128 : 16
      ctx.strokeStyle = '#f00'
      renderArrow(
        ctx,
        (x + px) * scale,
        (y + py) * scale,
        (x + ax * SCALE_VECTOR + px) * scale,
        (y + ay * SCALE_VECTOR + py) * scale,
        arrowLength,
      )
    }

    // name label
    if (owner >= 0) {
      ctx.font = `11px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillStyle = '#fff'
      ctx.fillText(`player${owner}`,
        (x + px) * scale,
        (y + py - 80) * scale,
      )
    }
  })

  // play/stop button
  const playButtonY = ((0.91 * height) | 0)
  const playButtonW = ((0.04 * width) | 0)
  const playButtonH = ((0.05 * height) | 0) - 2
  const showAsPlaying = dragging ? playingBeforeDrag : playing
  ctx.lineWidth = 4
  ctx.strokeStyle = showAsPlaying ? '#7f0000' : '#007f00'
  ctx.fillStyle = '#000'
  ctx.strokeRect(2, playButtonY, playButtonW, playButtonH)
  ctx.fillRect(2, playButtonY, playButtonW, playButtonH)

  ctx.font = `${width * 0.012}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText(showAsPlaying ? '⏹️' : '▶️', 0.02 * width, 0.935 * height)

  // time
  ctx.textAlign = 'start'
  ctx.fillText(`${renderT.toFixed(3)}`, 0.06 * width, 0.935 * height)

  // progress bar
  const progressBarY = ((0.96 * height) | 0)
  const progressBarH = (0.04 * height) | 0
  ctx.lineWidth = 2
  ctx.strokeStyle = '#777'
  ctx.beginPath()
  ctx.moveTo(0, progressBarY)
  ctx.lineTo(width, progressBarY)
  ctx.closePath()
  ctx.stroke()
  ctx.fillStyle = '#000'
  ctx.fillRect(0, progressBarY + 1, width, progressBarH)
  ctx.fillStyle = '#f00'
  ctx.fillRect(0, progressBarY + 1, renderT / MAX_TIME_S * width, progressBarH)
}

function renderIfNotPlaying () {
  if (!playing) renderCanvas()
}

function onresize () {
  updateCanvasSize()
  renderCanvas()
}

let dragging = false
let playingBeforeDrag = false
let dragTime = 0
let dragX = 0
let dragY = 0
let dragTimeBase = 0
function startDrag () {
  dragging = true
  if (playingBeforeDrag = !!playing) {
    playStop()
  }
}

function stopDrag () {
  if (!dragging) return
  playStartTime = 0
  pauseTime = dragTime * 1000
  dragging = false
  if (playingBeforeDrag) {
    playStart()
  }
}

function mousedown (xx: number, yy: number): true | undefined {
  const { clientWidth, clientHeight } = canvas
  const x = xx - canvas.getBoundingClientRect().left
  const y = yy - canvas.getBoundingClientRect().top

  if (y > 0.95 * clientHeight) {
    // start dragging progress bar
    startDrag()
    return true
  }

  if (y > 0.9 * clientHeight && x < 0.04 * clientWidth) {
    // play/stop button
    (playing ? playStop : playStart)()
    return true
  }

  // detect selected orb
  let orb: number | undefined
  let orbDistSquared = Infinity

  function checkOrb (i: number, ox: number, oy: number, radius: number) {
    const dx = x - ox
    const dy = y - oy
    const d2 = dx * dx + dy * dy
    if (d2 < orbDistSquared && d2 <= 4 * radius * radius) { // allow 2x radius as hitbox
      orb = i
      orbDistSquared = d2
    }
  }

  const scale = clientWidth / 8000
  const px = clientWidth / 2 / scale
  const py = clientHeight / 2 / scale

  // check sun
  checkOrb(-1, 0.5 * clientWidth, 0.5 * clientHeight, 80 * scale)
  // check orbs
  orbs.value.forEach((orb, i) => {
    const [x, y] = calcPosAtGameTime(orb.orbitDist, orb.orbitBaseAng, renderT)
    checkOrb(i, (x + px) * scale, (y + py) * scale, 25 * scale)
  })

  if (orb !== undefined) {
    if (selectedOrb == orb && orb >= 0) {
      // toggle orb protection state
      orbs.value[orb]._protected = !orbs.value[orb]._protected
    }
    selectedOrb = orb
    renderIfNotPlaying()
  }
  return
}

function onmousedown (event: MouseEvent) {
  mousedown(event.x, event.y)
}

function ontouchstart (event: TouchEvent) {
  if (event.targetTouches.length < 1) return

  const touch = event.targetTouches.item(0)
  if (!touch) return
  if (mousedown(touch.clientX, touch.clientY)) {
    event.preventDefault()
  }
}

function mousemove (mouseX: number, mouseY: number) {
  const { left: rX, top: rY } = canvas.getBoundingClientRect()
  const newX = clamp((mouseX - rX) / canvas.clientWidth, 0, 1)
  const newY = clamp((mouseY - rY) / canvas.clientHeight, 0, 1)

  if (newY > 0.95) {
    // snap to time in progress bar
    dragTime = (dragTimeBase = newX) * MAX_TIME_S
    dragX = newX
    dragY = 1
  } else {
    // slower scrubbing
    const newDragY = Math.min(newY / 0.95, 1)
    const newDragMul = Math.pow(newDragY, 2.5)

    if (newY < dragY) {
      // adjust base time to keep dragTime constant while moving upwards
      dragTimeBase = (dragTime / MAX_TIME_S - dragX * newDragMul) / (1 - newDragMul)
    }

    dragTime = (dragTimeBase + (newX - dragTimeBase) * newDragMul) * MAX_TIME_S

    dragX = newX
    dragY = newDragY
  }

  renderCanvas()
}

function onmousemove (event: MouseEvent) {
  if (!dragging) return

  mousemove(event.x, event.y)
}

function ontouchmove (event: TouchEvent) {
  if (event.targetTouches.length < 1 || !dragging) return

  event.preventDefault()

  const touch = event.targetTouches.item(0)
  if (!touch) return
  mousemove(touch.clientX, touch.clientY)
}

onMount(() => {
  context = canvas!.getContext('2d')
  updateCanvasSize()
  ;(orbs.value.length ? renderIfNotPlaying : randomize)()
})
</script>

<svelte:window {onresize} onmouseup={stopDrag} ontouchend={stopDrag} />

<div class="my-2" style="container-type: inline-size">
  <canvas bind:this={canvas} style="width: min(100cqw, 200cqh); height: min(50cqw, 100cqh)"
    {onmousedown}
    {onmousemove}
    use:nonpassive={['touchstart', () => ontouchstart as EventListener]}
    use:nonpassive={['touchmove', () => ontouchmove as EventListener]}></canvas>
</div>

<h2>Settings</h2>
<div class="row row-cols-sm-auto g-3 align-items-center my-2">
  <div class="col-12">
    <b>Trajectories</b>
  </div>
  <div class="col-12">
    <label class="form-check form-check-inline">
      <input type="checkbox" class="form-check-input" bind:checked={drawPaths.value} onchange={renderIfNotPlaying}>
      draw path
    </label>
  </div>
  <div class="col-12">
    <input type="number" class="form-control" min="0" bind:value={drawPathDuration.value} onchange={renderIfNotPlaying}>
  </div>
</div>

<div>
  <b class="me-3">Show velocity</b>
  {#snippet radioModeVel(value: number, label: string)}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" bind:group={modeV.value} {value} onchange={renderIfNotPlaying}>
      <span class="form-check-label">{label}</span>
    </label>
  {/snippet}
  {@render radioModeVel(0, 'off')}
  {@render radioModeVel(1, '4 * actual')}
  {@render radioModeVel(2, '4 * approx')}
  {@render radioModeVel(3, '16384 * (actual - approx)')}
</div>

<div>
  <b class="me-3">Show acceleration</b>
  {#snippet radioModeAccel(value: number, label: string)}
    <label class="form-check form-check-inline">
      <input type="radio" class="form-check-input" bind:group={modeA.value} {value} onchange={renderIfNotPlaying}>
      <span class="form-check-label">{label}</span>
    </label>
  {/snippet}
  {@render radioModeAccel(0, 'off')}
  {@render radioModeAccel(1, '16 * actual')}
  {@render radioModeAccel(2, '16 * approx')}
  {@render radioModeAccel(3, '128 * (approx - actual)')}
</div>

<h2>Orbs</h2>

<h3>Properties <button class="btn btn-outline-primary" onclick={randomize}>Randomize</button></h3>

<table class="table table-striped table-bordered table-hover w-auto">
  <thead>
    <tr>
      <th>Index</th>
      <th>orbitBaseAng</th>
      <th>distX</th>
      <th>distYMin</th>
      <th>distYRange</th>
      <th>baseDistYCycleAng</th>
      <th>distYChangeSpeed</th>
    </tr>
  </thead>
  <tbody>
    {#each orbs.value as orb, i}
      <tr>
        <th scope="row">{i}</th>
        <td>{i}/{orbs.value.length} &tau;</td>
        <td><input type="number" class="form-control" bind:value={orb.orbitDist.distX}></td>
        <td><input type="number" class="form-control" bind:value={orb.orbitDist.distYMin}></td>
        <td><input type="number" class="form-control" bind:value={orb.orbitDist.distYRange}></td>
        <td><input type="number" class="form-control" bind:value={orb.orbitDist.baseDistYCycleAng}></td>
        <td><input type="number" class="form-control" bind:value={orb.orbitDist.distYChangeSpeed}></td>
      </tr>
    {/each}
  </tbody>
</table>

<h3>Kinematics at Time</h3>

<input type="number"
  class="form-control"
  step="0.1"
  bind:value={tableTime}>
<input type="range"
  class="form-range"
  min="0" max={MAX_TIME_S} step="0.001"
  bind:value={tableTime}>

<table class="table table-striped table-bordered table-hover w-auto">
  <thead>
    <tr>
      <th>Index</th>
      <th>Position</th>
      <th>Velocity</th>
      <th>Acceleration</th>
    </tr>
  </thead>
  <tbody>
    {#each orbs.value as orb, i}
      {@const p = calcPosAtGameTime(orb.orbitDist, orb.orbitBaseAng, tableTime)}
      {@const v = vel(orb.orbitDist, orb.orbitBaseAng, tableTime)}
      {@const va = velApprox(orb.orbitDist, orb.orbitBaseAng, tableTime)}
      {@const vd = vecSubtract(va, v)}
      {@const a = accel(orb.orbitDist, orb.orbitBaseAng, tableTime)}
      {@const aa = accelApprox(orb.orbitDist, orb.orbitBaseAng, tableTime)}
      {@const ad = vecSubtract(aa, a)}
      <tr>
        <th scope="row">{i}</th>
        <td>{p[0]}, {p[1]}</td>
        <td title="approx{'\n'}({va[0]}, {va[1]}){'\n'}actual{'\n'}({v[0]}, {v[1]}){'\n'}error{'\n'}({vd[0]}, {vd[1]})">{v[0]}, {v[1]}</td>
        <td title="approx{'\n'}({aa[0]}, {aa[1]}){'\n'}actual{'\n'}({a[0]}, {a[1]}){'\n'}error{'\n'}({ad[0]}, {ad[1]})">{a[0]}, {a[1]}</td>
      </tr>
    {/each}
  </tbody>
</table>

<h3>Import/Export</h3>

<div class="input-group mb-3">
  <button class="btn btn-outline-primary" onclick={jsonImport}>Import from JSON</button>
  <button class="btn btn-outline-danger" onclick={jsonExport}>Export to JSON</button>
</div>
<textarea class="form-control" bind:value={importExportText}></textarea>
