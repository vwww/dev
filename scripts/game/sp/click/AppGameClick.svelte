<script lang="ts">
import { randomHexColor } from '@/util'
import { pState } from '@/util/svelte.svelte'

const highscore = pState('game/sp/click/highscore', 0)

let x = $state(0.5)
let y = $state(0.5)
let dx = 1
let dy = 1
let colorBack = $state('#fff')
let colorBtn = $state('#fff')

let cheat = $state(0)
let score = $state(0)
let tickDelay = 300

function tick (): void {
  x += dx / 22
  y += dy / 18.15

  if (x <= 0) dx = 1
  if (x >= 1 - .29) dx = -1
  if (y <= 0) dy = 1
  if (y >= 1 - .15) dy = -1

  colorBack = randomHexColor()
  colorBtn = randomHexColor()

  setTimeout(tick, tickDelay)
}

function clicked (): void {
  ++score
  if (highscore.value < score) {
    highscore.value = score
  }
  if (score === 250) {
    alert('You passed the challenge!')
  }
  if (tickDelay) {
    --tickDelay
  }
}

function checkCheat (): void {
  if (cheat >= 2) {
    clicked()
  }
}

tick()
</script>

<p>Score: {score} (high score: {highscore.value})</p>

<div oncontextmenu={() => cheat++} class="play" style="background-color:{colorBack}" role="presentation">
  <button onclick={clicked} onmousemove={checkCheat} style="background-color:{colorBtn}; left:{x * 100}%;top:{y * 100}%">Click</button>
</div>

<style>
.play {
  width: 80vw;
  height: calc(80vw / (16 / 9));
  max-width: calc(80vh * (16 / 9));
  max-height: 80vh;
  border: solid 0.2em black;
  opacity: 0.5;
  overflow: hidden;

  button {
    position: relative;
    width: 29%;
    height: 15%;
    font-size: 200%;
    opacity: 1;
  }
}
</style>
