<script lang="ts">
import { pState } from '@/util/svelte.svelte'

const WIDTH = 10
const HALF_WIDTH = WIDTH / 2
const HEIGHT = 20

const MOMENT_MAX = 69
const MOMENT_MIN = -MOMENT_MAX

const POINTS_PER_TICK = 1
const POINTS_PER_BLOCK_DROPPED = 100
const POINTS_PER_ROW_CLEARED = 1000

const INTERVAL_START = 200
const INTERVAL_FACTOR = 0.000025
const INTERVAL_MIN = 1

const COLORS = [
  '#000',
  'red',
  'orangered',
  'orange',
  'yellow',
  'chartreuse',
  'yellowgreen',
  'lime',
  'limegreen',
  'darkgreen',
  'aquamarine',
  'magenta',
  'orchid'
]

import MomentBar from './MomentBar.svelte'

import { type TetrominoShape, tetrominoShapes } from './shapes'
import { shuffle } from '@/util'

// game settings
const showGhost = pState('game/sp/tetris/showGhost', true)
const speedup = pState('game/sp/tetris/speedup', true)
const highscore = pState('game/sp/tetris/highscore', 0)

// next block system
const gameBlocks = [...tetrominoShapes]
let gameBlockIndex = $state(0)
const nextBlock = $derived(gameBlocks[gameBlockIndex][0])
let nextColor = $state(((Math.random() * (COLORS.length - 1)) | 0) + 1)
function getNextBlock (): TetrominoShape {
  const block = gameBlocks[gameBlockIndex]
  setNextBlock()
  return block
}
/*
function peekNextBlock (): TetrominoShape {
  return gameBlocks[gameBlockIndex]
}
*/
function setNextBlock (): void {
  gameBlockIndex++
  if (gameBlockIndex === gameBlocks.length) {
    resetNextBlock()
  }
}
function resetNextBlock (): void {
  gameBlockIndex = 0
  shuffle(gameBlocks)
}

// game state
let gameRunning = $state(false)
let gamePaused = $state(false)
let gameTimeout = 0
let grid = $state(Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(0)))
let moment = $state(0)
let score = $state(0)
let linesCleared = $state(0)
let keyLeft = false
let keyRight = false
let keyUp = false
let keyDown = false
let intervalTarget = $state(-1)

// current block
let curR = -1
let curC = $state(-1)
let maxR = $state(-1)
let ghostLines = $state(HEIGHT)
let curBlock: TetrominoShape | undefined = $state()
let curBlockIndex = $state(-1)
let curColor = $state(-1)

function newGame (): void {
  for (let r = 0; r < HEIGHT; r++) {
    const row = grid[r]
    for (let c = 0; c < WIDTH; c++) {
      row[c] = 0
    }
  }
  moment = 0
  score = 0
  linesCleared = 0
  gameRunning = true
  gamePaused = false
  tryStartNewBlock()

  if (gameTimeout) {
    clearTimeout(gameTimeout)
  }
  gameTimeout = window.setTimeout(gameTick, 0)
  intervalTarget = INTERVAL_START
}

function togglePause (): void {
  gamePaused = !gamePaused
  if(!gamePaused && gameRunning) {
    gameTick()
  }
}

function gameOver (): void {
  gameRunning = false
  clearTimeout(gameTimeout)
  gameTimeout = 0
}

function tryStartNewBlock (): void {
  curR = 0
  curC = (Math.random() * (WIDTH - 4 + 1)) | 0
  curBlock = getNextBlock()
  curBlockIndex = 0
  curColor = nextColor
  nextColor = ((Math.random() * (COLORS.length - 1)) | 0) + 1
  recalcMaxR()

  addBlock()

  if (!maxR) {
    gameOver()
  }
}

function canAddBlock (): boolean {
  let r = curR
  for (let dr = 0; dr < 4; dr++, r++) {
    const rowOutOfBounds = (r < 0 || r >= HEIGHT)

    let c = curC
    for (let dc = 0; dc < 4; dc++, c++) {
      const colOutOfBounds = (c < 0 || c >= WIDTH)

      if ((rowOutOfBounds || colOutOfBounds || grid[r][c] !== 0) && curBlock![curBlockIndex][dr][dc]) {
        return false
      }
    }
  }

  return true
}

function isGhost (curBlock: TetrominoShape | undefined, curBlockIndex: number, maxR: number, curC: number, r: number, c: number): boolean {
  if (grid[r][c] || !curBlock) return false

  const curBlockRows = curBlock[curBlockIndex]
  const gr = r - maxR
  if (gr < 0 || gr >= curBlockRows.length) return false

  const curBlockCols = curBlockRows[gr]
  const gc = c - curC
  if (gc < 0 || gc >= curBlockCols.length) return false

  return !!curBlockCols[gc]
}

function recalcMaxR (): void {
  const oldR = curR
  do {
    curR++
    if (!canAddBlock()) {
      curR--
      break
    }
  } while (curR < HEIGHT)
  maxR = curR

  addBlock()

  ghostLines = HEIGHT
  while (ghostLines && grid[ghostLines - 1].every(v => v !== 0)) {
    ghostLines--
  }

  removeBlock()

  curR = oldR
}

function setBlock (val: number): void {
  let r = curR
  for (let dr = 0; dr < 4; dr++, r++) {
    if (r < 0 || r >= HEIGHT) {
      continue
    }

    let c = curC
    for (let dc = 0; dc < 4; dc++, c++) {
      if (c < 0 || c >= WIDTH || !curBlock![curBlockIndex][dr][dc]) {
          continue
      }

      grid[r][c] = val
    }
  }
}

function addBlock (): void {
  setBlock(curColor)
}

function removeBlock (): void {
  setBlock(0)
}

function addMoment (): void {
  let r = curR
  for (let dr = 0; dr < 4; dr++, r++) {
    if (r < 0 || r >= HEIGHT) {
      continue
    }

    let c = curC
    for (let dc = 0; dc < 4; dc++, c++) {
      if (c < 0 || c >= WIDTH || !curBlock![curBlockIndex][dr][dc]) {
          continue
      }

      moment += HALF_WIDTH - c - (c >= HALF_WIDTH ? 1 : 0)
    }
  }
}

function gameUpdate (): void {
  score += POINTS_PER_TICK

  removeBlock()

  let maxRdirty = false

  // Try rotation
  if (keyUp) {
    curBlockIndex = (curBlockIndex + 1) % curBlock!.length
    if (!canAddBlock()) {
      curBlockIndex = (curBlockIndex || curBlock!.length) - 1
    } else {
      maxRdirty = true
    }
  }

  // Try move left/right
  if (keyLeft !== keyRight) {
    // Undo when movement is disallowed
    curC += keyLeft ? -1 : 1
    if (!canAddBlock()) {
      curC += keyLeft ? 1 : -1
    } else {
      maxRdirty = true
    }
  }

  // Recalc
  if (maxRdirty) {
    recalcMaxR()
  }

  // Move block down
  const maxMoveDown = maxR - curR
  curR += Math.min(maxMoveDown, keyDown ? 3 : 1)

  addBlock()

  // Lock the block if it cannot be moved down
  if (!maxMoveDown && !maxRdirty) {
    addMoment()

    score += POINTS_PER_BLOCK_DROPPED

    // Check for cleared rows
    let dst = HEIGHT - 1 // destination for current row
    for (let r = dst; r !== -1; r--) {
      const rowFilled = grid[r].every(v => v !== 0)
      if (rowFilled) {
        score += POINTS_PER_ROW_CLEARED
        linesCleared++
      } else {
        if (dst !== r) {
          // copy to lower row
          for (let col = 0; col < WIDTH; col++) {
            grid[dst][col] = grid[r][col]
          }
        }
        dst--
      }
    }
    for (; dst !== -1; dst--) {
      for (let col = 0; col < WIDTH; col++) {
        grid[dst][col] = 0
      }
    }

    // Check moment
    // Start next block
    (moment < MOMENT_MIN || moment > MOMENT_MAX ? gameOver : tryStartNewBlock)()
  }

  // Update high score
  if (highscore.value < score) {
    highscore.value = score
  }
}

function gameTick (): void {
  if (gamePaused) return

  if (speedup.value) {
    intervalTarget -= INTERVAL_FACTOR * (intervalTarget * intervalTarget)
    if (intervalTarget < INTERVAL_MIN) {
      intervalTarget = INTERVAL_MIN
    }
  }
  gameTimeout = window.setTimeout(gameTick, intervalTarget | 0)

  gameUpdate()
}

function handleKey (event: KeyboardEvent, on: boolean): void {
  if (event.defaultPrevented) return

  switch(event.code) {
    case "KeyS":
    case "ArrowDown":
      keyDown = on
      break
    case "KeyW":
    case "ArrowUp":
      keyUp = on
      break
    case "KeyA":
    case "ArrowLeft":
      keyLeft = on
      break
    case "KeyD":
    case "ArrowRight":
      keyRight = on
      break
    default:
      return
  }

  event.preventDefault()
}
</script>

<svelte:window
  onkeyup={event => handleKey(event, false)}
  onkeydown={event => handleKey(event, true)}
/>

<div class="btn-group d-flex" role="group">
  <button onclick={newGame} class="btn btn-outline-primary w-100">New Game</button>
  <button onclick={togglePause} class="btn w-100 btn-{gamePaused ? '' : 'outline-'}warning">Pause</button>
  <button onclick={() => showGhost.value = !showGhost.value} class="btn w-50 btn-{showGhost.value ? '' : 'outline-'}success">Ghost Piece</button>
  <button onclick={() => speedup.value = !speedup.value} class="btn w-50 btn-{speedup.value ? 'primary' : 'outline-secondary'}">Speedup</button>
</div>

<p>
  ({gameRunning ? gamePaused ? 'Paused' : (INTERVAL_START / (intervalTarget | 0)).toPrecision(3) + 'x' : 'Game over'}) |
  Score: {score} | High Score: {highscore.value} | Lines cleared: {linesCleared} | Moment: {!moment ? '0' : moment > 0 ? moment + ' CCW' : -moment + ' CW'} ({MOMENT_MAX} max)
</p>

<table style="backface-visibility: hidden; transform: rotate({-moment / MOMENT_MAX * 45}deg)">
  <tbody>
    {#each grid as row, r}
      <tr>
        {#each row as cell, c}
          {@const cellIsGhost = showGhost.value && !cell && isGhost(curBlock, curBlockIndex, maxR, curC, r, c)}
          <td
            class:ghost={cellIsGhost}
            class:ghostLine={showGhost.value && r >= ghostLines}
            style="background-color:{COLORS[cell || (cellIsGhost ? curColor : 0)]}"
  ></td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<div class="d-flex my-3">
  <div class="progress w-50" style="transform: scaleX(-1)">
    <MomentBar {moment} momentMax={MOMENT_MAX} />
  </div>
  <div class="progress w-50">
    <MomentBar moment={-moment} momentMax={MOMENT_MAX} />
  </div>
</div>

<table>
  <tbody>
    {#each nextBlock as row}
      <tr>
        {#each row as cell}
          <td style="background-color:{COLORS[cell ? nextColor : 0]}"></td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
table {
  margin: auto;
}
td {
  width: 3vmin;
  height: 3vmin;
  &.ghost {
    opacity: 0.2;
  }
  &.ghostLine {
    animation: blinker 0.5s linear infinite;
  }
}

@keyframes blinker {
  50% {
    opacity: 0.4;
  }
}
</style>
