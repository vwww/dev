<script lang="ts">
import { randomHexColor } from '../../util'
import { pStore } from '../../util/svelte'

const colorMode = pStore('misc/seizure/mode', 0)
const interval = pStore('misc/seizure/int', -1)
const userColor = pStore('misc/seizure/color', '#FFFFFF')
const useTimeMax = pStore('misc/seizure/useTimeMax', 0)

let running = false
let runBackgroundColorInt = 0
let runTimeLast = 0
let runTimeInt = 0
let useTime = -1

let winW = 0
let winH = 0
$: winA = winW * winH
const minWinA = 250000
let windowIsBlurred = false

let strobeContainer: HTMLDivElement
let curColor: string = '#000'

function nextColor (): void {
  let curOpacity = 1
  if ($colorMode < 4) {
    if (!($colorMode & 1)) {
      // Black and white (toggle colors)
      curColor = curColor === '#000' ? '#fff' : '#000'
    } else {
      // Rainbow (random color)
      curColor = randomHexColor()
    }
    if ($colorMode >= 2) {
      curOpacity = Math.sqrt(Math.random())
    }
  } else {
    curColor = $userColor
  }
  strobeContainer.style.backgroundColor = curColor
  strobeContainer.style.opacity = curOpacity + ''
}

function start (): void {
  running = true

  useTime = 0
  runTimeLast = Date.now()
  runTimeInt = window.setInterval(() => {
    const now = Date.now()
    if ($colorMode < 4 && winA >= minWinA && !windowIsBlurred) {
      useTime += now - runTimeLast
    }
    runTimeLast = now
  }, 1)

  if ($interval < 0) {
    (function animCallback () {
      runBackgroundColorInt = requestAnimationFrame(animCallback)
      nextColor()
    })()
  } else {
    runBackgroundColorInt = window.setInterval(nextColor, $interval)
  }
}

function stop (): void {
  running = false
  if (runTimeInt) {
    clearInterval(runTimeInt)
  }

  if (runBackgroundColorInt) {
    ($interval < 0 ? cancelAnimationFrame : clearInterval)(runBackgroundColorInt)
    runBackgroundColorInt = 0
  }

  if ($useTimeMax < useTime) {
    $useTimeMax = useTime
  }
}

function updateWindowSize (): void {
  winW = window.innerWidth || document.body.offsetWidth || document.getElementsByTagName('body')[0].clientWidth
  winH = window.innerHeight || document.body.offsetHeight || document.getElementsByTagName('body')[0].clientHeight
}

function formatSeconds (ms: number): string {
  const s = (ms / 1000).toPrecision(3)
  return s.padEnd(s.indexOf('.')+1+3, '0')
}

updateWindowSize()
</script>

<svelte:window
  on:resize={updateWindowSize}
  on:blur={() => windowIsBlurred = true}
  on:focus={() => windowIsBlurred = false} />

<div id="strobeContainer" bind:this={strobeContainer} class:invisible={!running} style="text-align: center" on:dblclick={stop}>
  <img on:click={stop} src="stop.png" alt="Stop">
  <div class="container">
    <button on:click={stop} class="btn d-block w-100 btn-danger">Secondary Stop</button>
    <div style=" color: white; mix-blend-mode: difference">
      {#if $colorMode < 4}
        <p>You have lasted {formatSeconds(useTime)} seconds!</p>
      {:else}
        <p>Time is not counted in static color mode.</p>
      {/if}
      <p>
          This <u>window <i>must be </i><b>focused</b> and <i>have a viewport area of at least a </i><b>quarter megapixel</b>.</u><br>
          (W * H = {winW} * {winH} = {winA}) {winA >= minWinA ? 'is large enough' : 'needs another ' + (minWinA - winA) + ' pixels of area!'}
        </p>
    </div>
  </div>
</div>

<div class="input-group mb-3">
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={$colorMode} value={0}>
      Black and White
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={$colorMode} value={1}>
      Rainbow
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={$colorMode} value={2}>
      Translucent BW
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={$colorMode} value={3}>
      Translucent Rainbow
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={$colorMode} value={4}>
      Fixed-color
    </label>
  </div>
  <select bind:value={$userColor} class="form-select">
    <optgroup label="Extreme">
      <option value="#FFFFFF" style="background-color: #FFFFFF;">White</option>
      <option value="#000000" style="background-color: #000000;color: #FFFFFF;">Black</option>
    </optgroup>
    <optgroup label="Primary">
      <option value="#FF0000" style="background-color: #FF0000;">Red</option>
      <option value="#FFFF00" style="background-color: #FFFF00;">Yellow</option>
      <option value="#0000FF" style="background-color: #0000FF;color: #FFFFFF;">Blue</option>
    </optgroup>
    <optgroup label="Secondary">
      <option value="#FF7F00" style="background-color: #FF7F00;">Orange</option>
      <option value="#FF00FF" style="background-color: #FF00FF;">Violet</option>
      <option value="#00FF00" style="background-color: #00FF00;">Green</option>
    </optgroup>
    <optgroup label="Tertiary">
      <option value="#FF4900" style="background-color: #FF4900;">Red-Orange</option>
      <option value="#FF9200" style="background-color: #FF9200;">Yellow-Orange</option>
      <option value="#CCF600" style="background-color: #CCF600;">Yellow-Green</option>
      <option value="#00FFFF" style="background-color: #00FFFF;">Blue-Green</option>
      <option value="#6D00FF" style="background-color: #6D00FF;">Blue-Violet</option>
      <option value="#A600A6" style="background-color: #A600A6;">Red-Violet</option>
    </optgroup>
  </select>
</div>

<div class="input-group mb-3">
  <label class="input-group-text" for="inputGroupSelectInterval">Interval</label>
  <select bind:value={$interval} class="form-select" id="inputGroupSelectInterval">
    <option value="-1" class="def">ASAP (requestAnimationFrame)</option>
    <optgroup label="Possible Lag">
      <option value="0" class="maxlag">ASAP (0 ms)</option>
      <option value="1" class="lag">1/1000 (1 ms)</option>
      <option value="2" class="lag">1/500 (2 ms)</option>
      <option value="2" class="lag">1/333 (3 ms)</option>
    </optgroup>
    <optgroup label="Decent">
      <option value="4" class="def">1/250 (4 ms)</option>
      <option value="5" class="def">1/200 (5 ms)</option>
      <option value="10" class="def">1/100 (10 ms)</option>
    </optgroup>
    <optgroup label="Balanced-Slow">
      <option value="20" class="slow">1/50 (20 ms)</option>
      <option value="40" class="slow">1/25 (40 ms)</option>
      <option value="50" class="slow">1/20 (50 ms)</option>
    </optgroup>
    <optgroup label="Slow">
      <option value="67" class="sslow">1/15 (67 ms)</option>
      <option value="100" class="sslow">1/10 (100 ms)</option>
      <option value="125" class="sslow">1/8 (125 ms)</option>
    </optgroup>
    <optgroup label="Extremely Slow">
      <option value="250" class="ssslow">1/4 (250 ms)</option>
      <option value="500" class="ssslow">1/2 (1000 ms)</option>
      <option value="1000" class="ssslow">1 (1000 ms)</option>
      <option value="2000" class="ssslow">2 (2000 ms)</option>
    </optgroup>
  </select>
</div>

<p>Last usage time: {useTime < 0 ? '(click Start)' : formatSeconds(useTime) + ' s'} (longest {formatSeconds($useTimeMax) + ' s'})</p>

<button on:click={start} class="btn d-block w-100 btn-primary">Start</button>

<style>
#strobeContainer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
}
option.maxlag { background: #860909 }
option.lag { background: #FF7673 }
option.def { background: #CAF378 }
option.slow { background: #FFC373 }
option.sslow,option.ssslow { background: #66A3D2 }
optgroup { background: #A0A0A0 }
</style>
