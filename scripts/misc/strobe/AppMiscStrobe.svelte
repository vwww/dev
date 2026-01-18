<script lang="ts">
import { randomHexColor } from '@/util'
import { pState } from '@/util/svelte.svelte'

const MIN_WIN_AREA = 250000
const DEFAULT_IMAGE_URL = '../assets/victorz/logo.png'

const colorMode = pState('misc/strobe/mode', 0)
const imageMode = pState('misc/strobe/imageMode', 0)
const imageURL = pState('misc/strobe/imageURL', DEFAULT_IMAGE_URL)
const interval = pState('misc/strobe/int', -1)
const imageMultiplier = pState('misc/strobe/imageMult', 1)
const userColor = pState('misc/strobe/color', '#fff')
const userColor2 = pState('misc/strobe/color2', 'rgba(0, 0, 0, 0.5)')
const useTimeMax = pState('misc/strobe/useTimeMax', 0)

let running = $state(false)
let runBackgroundColorInt = 0
let runImageInt = 0
let runTimeLast = 0
let runTimeInt = 0
let useTime = $state(-1)

let winW = $state(0)
let winH = $state(0)
const winA = $derived(winW * winH)
let windowIsBlurred = $state(false)

const countUseTime = $derived(colorMode.value < 4 || imageMode.value)

let strobe = false
let curColor: string = $state('#000')
let curOpacity = $state(1)
let imageStrobe = $state(false)

function nextColor (): void {
  if (colorMode.value < 4) {
    if (!(colorMode.value & 1)) {
      // Black and white (toggle colors)
      curColor = (strobe = !strobe) ? '#fff' : '#000'
    } else {
      // Rainbow (random color)
      curColor = randomHexColor()
    }
    if (colorMode.value >= 2) {
      curOpacity = Math.sqrt(Math.random())
    }
  } else {
    curColor = colorMode.value < 5 ? userColor.value : userColor2.value
  }
}

function nextImageInvert (): void {
  imageStrobe = !imageStrobe
}

function start (): void {
  running = true

  useTime = 0
  runTimeLast = Date.now()
  runTimeInt = window.setInterval(() => {
    const now = Date.now()
    if (countUseTime && winA >= MIN_WIN_AREA && !windowIsBlurred) {
      useTime += now - runTimeLast
    }
    runTimeLast = now
  }, 1)

  curOpacity = 1

  strobe = imageStrobe = false
  if (interval.value < 0) {
    (function animCallback () {
      runBackgroundColorInt = requestAnimationFrame(animCallback)
      nextColor()
      nextImageInvert()
    })()
  } else {
    runBackgroundColorInt = window.setInterval(nextColor, interval.value)
    runImageInt = window.setInterval(nextImageInvert, interval.value * imageMultiplier.value)
    nextColor()
  }
}

function stop (): void {
  running = false
  if (runTimeInt) {
    clearInterval(runTimeInt)
  }

  if (runBackgroundColorInt) {
    (interval.value < 0 ? cancelAnimationFrame : clearInterval)(runBackgroundColorInt)
    runBackgroundColorInt = 0
  }

  if (runImageInt) {
    clearInterval(runImageInt)
    runImageInt = 0
  }

  if (useTimeMax.value < useTime) {
    useTimeMax.value = useTime
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

function handleImageFile (this: HTMLInputElement): void {
  const file = this.files![0]
  if (!file) return

  const clearFile = () => this.value = ''

  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    imageURL.value = reader.result as string
    imageMode.value = 1
    clearFile()
  }
  reader.onerror = clearFile
}

updateWindowSize()
</script>

<svelte:window
  onresize={updateWindowSize}
  onblur={() => windowIsBlurred = true}
  onfocus={() => windowIsBlurred = false} />

<div id="strobeContainer" class:invisible={!running} style="text-align:center;background-color:{curColor};opacity:{curOpacity}" ondblclick={stop} role="presentation">
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
  <img onclick={stop} src="seizure/stop.png" alt="Stop">
  <div class="container">
    <button onclick={stop} class="btn d-block w-100 btn-danger">Secondary Stop</button>
    <div style="color: white; mix-blend-mode: difference">
      {#if countUseTime}
        <p>You have lasted {formatSeconds(useTime)} seconds!</p>
      {:else}
        <p>Time is not counted in static color mode.</p>
      {/if}
      <p>
        This <u>window <i>must be</i> <b>focused</b> and <i>have a viewport area of at least a</i> <b>quarter megapixel</b>.</u><br>
        (W * H = {winW} * {winH} = {winA}) {winA >= MIN_WIN_AREA ? 'is large enough' : 'needs another ' + (MIN_WIN_AREA - winA) + ' pixels of area!'}
      </p>
    </div>
    {#if imageMode.value}
      <img src={imageURL.value} style="{imageStrobe ? 'filter:invert(1)' : ''}" alt="">
    {/if}
  </div>
</div>

<div class="input-group mb-3">
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={0}>
      Black and White
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={1}>
      Rainbow
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={2}>
      Translucent BW
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={3}>
      Translucent Rainbow
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={4}>
      Fixed-color
    </label>
  </div>
  <select bind:value={userColor.value} class="form-select">
    <optgroup label="Extreme">
      <option value="#fff" style="background-color: #fff;">White</option>
      <option value="#000" style="background-color: #000;color: #fff;">Black</option>
    </optgroup>
    <optgroup label="Primary">
      <option value="#f00" style="background-color: #f00;">Red</option>
      <option value="#ff0" style="background-color: #ff0;">Yellow</option>
      <option value="#00f" style="background-color: #00f;color: #fff;">Blue</option>
    </optgroup>
    <optgroup label="Secondary">
      <option value="#ff7f00" style="background-color: #ff7f00;">Orange</option>
      <option value="#f0f" style="background-color: #f0f;">Violet</option>
      <option value="#0f0" style="background-color: #0f0;">Green</option>
    </optgroup>
    <optgroup label="Tertiary">
      <option value="#ff4900" style="background-color: #ff4900;">Red-Orange</option>
      <option value="#ff9200" style="background-color: #ff9200;">Yellow-Orange</option>
      <option value="#ccf600" style="background-color: #ccf600;">Yellow-Green</option>
      <option value="#0ff" style="background-color: #0ff;">Blue-Green</option>
      <option value="#6d00ff" style="background-color: #6d00ff;">Blue-Violet</option>
      <option value="#a600a6" style="background-color: #a600a6;">Red-Violet</option>
    </optgroup>
  </select>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={colorMode.value} value={5}>
      Custom
    </label>
  </div>
  <input type="url" class="form-control" bind:value={userColor2.value}>
</div>

<div class="input-group mb-3">
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={imageMode.value} value={0}>
      No Image
    </label>
  </div>
  <div class="input-group-text">
    <label class="form-check">
      <input type="radio" class="form-check-input" bind:group={imageMode.value} value={1}>
      URL
    </label>
  </div>
  <input type="url" class="form-control" bind:value={imageURL.value}>
  <input type="file" class="form-control" accept="image/*" onchange={handleImageFile}>
  <button class="btn btn-outline-secondary" onclick={() => imageURL.value = DEFAULT_IMAGE_URL}>Reset</button>
</div>

<div class="input-group mb-3">
  <label class="input-group-text" for="inputGroupSelectInterval">Interval</label>
  <select bind:value={interval.value} class="form-select" id="inputGroupSelectInterval">
    <option value={-1} class="def">ASAP (requestAnimationFrame)</option>
    <optgroup label="Possible Lag">
      <option value={0} class="maxlag">ASAP (0 ms)</option>
      <option value={1} class="lag">1/1000 (1 ms)</option>
      <option value={2} class="lag">1/500 (2 ms)</option>
      <option value={3} class="lag">1/333 (3 ms)</option>
    </optgroup>
    <optgroup label="Decent">
      <option value={4} class="def">1/250 (4 ms)</option>
      <option value={5} class="def">1/200 (5 ms)</option>
      <option value={10} class="def">1/100 (10 ms)</option>
    </optgroup>
    <optgroup label="Balanced-Slow">
      <option value={20} class="slow">1/50 (20 ms)</option>
      <option value={40} class="slow">1/25 (40 ms)</option>
      <option value={50} class="slow">1/20 (50 ms)</option>
    </optgroup>
    <optgroup label="Slow">
      <option value={67} class="sslow">1/15 (67 ms)</option>
      <option value={100} class="sslow">1/10 (100 ms)</option>
      <option value={125} class="sslow">1/8 (125 ms)</option>
    </optgroup>
    <optgroup label="Extremely Slow">
      <option value={250} class="ssslow">1/4 (250 ms)</option>
      <option value={500} class="ssslow">1/2 (500 ms)</option>
      <option value={1000} class="ssslow">1 (1000 ms)</option>
      <option value={2000} class="ssslow">2 (2000 ms)</option>
    </optgroup>
  </select>
  {#if interval.value > 0}
    <label class="input-group-text" for="inputGroupSelectInterval">Image Multiplier</label>
    <select bind:value={imageMultiplier.value} class="form-select" id="inputGroupSelectInterval">
      <optgroup label="Faster">
        <option value={0.25} class="sslow">1/5 [0.25]</option>
        <option value={0.5} class="sslow">1/2 [0.5]</option>
        <option value={0.75} class="sslow">3/4 [0.75]</option>
      </optgroup>
      <optgroup label="Same">
        <option value={1} class="def">Same [1]</option>
      </optgroup>
      <optgroup label="Slower">
        <option value={1.25} class="slow">1 + 1/4 [1.25]</option>
        <option value={1.5} class="slow">1 + 1/2 [1.5]</option>
        <option value={1.75} class="slow">1 + 3/4 [1.75]</option>
        <option value={2} class="slow">Double [2]</option>
      </optgroup>
      <optgroup label="Big Difference">
        <option value={3} class="lag">Triple [3]</option>
        <option value={4} class="lag">Quadruple [4]</option>
        <option value={5} class="lag">Quintuple [5]</option>
      </optgroup>
    </select>
  {/if}
</div>

<p>Last usage time: {useTime < 0 ? '(click Start)' : formatSeconds(useTime) + ' s'} (longest {formatSeconds(useTimeMax.value) + ' s'})</p>

<button onclick={start} class="btn d-block w-100 btn-primary mb-3">Start</button>

<style>
#strobeContainer {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10000;
}
option {
  &.maxlag { background: #800 }
  &.lag { background: #f77 }
  &.def { background: #cf7 }
  &.slow { background: #fc7 }
  &.sslow { background: #7ad }
  &.ssslow { background: #ace }
}
optgroup { background: #aaa }
</style>
