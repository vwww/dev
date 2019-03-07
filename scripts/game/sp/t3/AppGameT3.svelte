<script lang="ts">
import { onMount } from 'svelte'

import Board from './Board.svelte'
import MoveTable from './MoveTable.svelte'
import { initMemo, getMemo as getMemoOrig, playerTypes, type MemoEntry } from '@gc/t3/ai'
import { checkWin, occupied, remapWin, Winner, type WinnerMap } from '@gc/t3/game'
import { randomArrayItem } from '@/util'
import { pState } from '@/util/svelte.svelte'

// Options state
const showHints = pState('game/sp/t3/showHints', true)
const playerTypeIndex = pState('game/sp/t3/playerType', [0, 4])
const winnerX = pState('game/sp/t3/winnerX', 1)
const winnerO = pState('game/sp/t3/winnerO', 2)
const winnerTie = pState('game/sp/t3/winnerTie', 3)

const winnerMap = $derived([winnerX.value, winnerO.value, winnerTie.value] as WinnerMap)
// checkWinner when needed
$effect(() => {
  winnerX.value
  winnerO.value
  winnerTie.value

  checkWinner()
})

// Game state
let board: number = $state()!
let mark: number = $state()!
let winner: Winner = $state()!
let moveLength: number = $state()!
let undoLength: number = $state()!
let moveStack: number[] = $state(Array(9))
let boardHistory: number[] = $state(Array(10))
let currentMessage = $state('')

// async loading
let getMemo: GetMemoType | undefined = $state()

function resetGame (): void {
  board = 0
  mark = 1
  winner = 0

  moveLength = 0
  undoLength = 0
  boardHistory[0] = 0
  // moveStack, boardHistory need not be reset

  currentMessage = 'Click to make the first move. It&rsquo;s an exciting new game.'
}

function startGame (): void {
  resetGame()
  moveBots()
}

function setPlayerType (p: 0 | 1, pType: number): void {
  playerTypeIndex.value[p] = pType
  startGame()
}

function canMove (loc: number): boolean {
  return !(winner || occupied(board, loc))
}

function makeMove (loc: number): void {
  // Add move to board
  board |= mark << (loc << 1)
  mark ^= 3
  moveStack[moveLength++] = loc
  boardHistory[moveLength] = board

  checkWinner()
}

function checkWinner (): void {
  winner = remapWin(checkWin(board, moveLength), winnerMap)

  if (winner) {
    currentMessage =
      winner === 3
        ? 'It&rsquo;s a tie.'
        : (winner === 1 ? 'X' : 'O') + ' wins!'
  }
}

function moveBots (): void {
  // Move bots as needed
  while (!winner) {
    const botType = playerTypes[playerTypeIndex.value[moveLength & 1]][1]
    if (!botType) break

    let moves
    [moves, currentMessage] = botType(board, moveLength, winnerMap)
    const move = randomArrayItem(moves)
    if (canMove(move)) {
      makeMove(move)
    }
  }
}

function moveHuman (loc: number): void {
  if (canMove(loc)) {
    currentMessage = 'Click to make a move.' // for next human player, could be overwritten by bot or win message
    makeMove(loc)
    undoLength++
    moveBots()
  }
}

function swapTypes (): void {
  playerTypeIndex.value = [playerTypeIndex.value[1], playerTypeIndex.value[0]]
  startGame()
}

function undoMove (): void {
  if (!undoLength) return

  do {
    // Undo bot move
    const move = moveStack[--moveLength]
    mark ^= 3
    board ^= mark << (move << 1)
    // repeat until we have undone a human move
  } while (playerTypes[playerTypeIndex.value[moveLength & 1]][1])

  winner = 0
  undoLength--
  currentMessage = 'You undid your move.'
}

// init
setTimeout(function () {
  currentMessage = '(Building game tables&hellip; This should take less than a second.)'
  const start = Date.now()
  initMemo()
  getMemo = getMemoOrig
  currentMessage = 'To build game tables, it took ' + (Date.now() - start) + ' ms.'
}, 1)

onMount(startGame)

// UI
const SETTINGS_X = [['X wins (Normal)', 'success'], ['O wins (Inverted)', 'danger'], ['Tie', 'warning']]
const SETTINGS_O = [['X wins (Inverted)', 'danger'], ['O wins (Normal)', 'success'], ['Tie', 'warning']]
const SETTINGS_T = [['X wins', 'primary'], ['O wins', 'info'], ['Tie (Normal)', 'success']]
const PRESETS = [
  [1, 2, 3, 'success', 'win (Normal)'],
  [2, 1, 3, 'danger', 'loss (Inverted)'],
  [2, 2, 1, 'warning', 'Tie'],
  [1, 1, 2, 'info', 'not Tie'],
  [1, 2, 1, 'primary', 'Last move'],
  [2, 1, 2, 'dark', 'not Last move'],
] as const
</script>

<script lang="ts" module>
export type GetMemoType = (state: number) => MemoEntry | undefined
</script>

<div class="row">
  {#snippet playerTypeSelector(index: 0 | 1)}
    <div class="btn-group d-flex mb-2" role="group">
      {#each playerTypes as [name], i}
        <button
          onclick={() => setPlayerType(index, i)}
          class="w-100 btn btn-outline-secondary"
          class:active={i === playerTypeIndex.value[index]}>{name}</button>
      {/each}
    </div>
  {/snippet}
  <div class="col-md-6">
    <strong>Player X</strong>
    {@render playerTypeSelector(0)}
  </div>
  <div class="col-md-6">
    <strong>Player O</strong>
    {@render playerTypeSelector(1)}
  </div>
  <div class="col-12">
    <strong>Options</strong>
    <div class="btn-group d-flex mb-2" role="group">
      <button onclick={() => { showHints.value = !showHints.value }} class="w-100 btn btn-{showHints.value ? 'success active' : 'outline-primary'}">Hints</button>
      <button onclick={swapTypes} class="w-100 btn btn-outline-secondary">Swap Types</button>
      <button onclick={undoMove} class="w-100 btn btn-outline-secondary" disabled={!undoLength}>Undo</button>
    </div>
  </div>
</div>

<h2>Board</h2>

<div class="row">
  <div class="col-sm-6">
    <p>{@html currentMessage}</p>
    <Board {board} {winner} {winnerMap} {mark} showHints={showHints.value} {getMemo} onMove={moveHuman} />
  </div>

  <div class="col-sm-6">
    <MoveTable {boardHistory} {moveStack} {moveLength} {winner} {winnerMap} {getMemo} />
  </div>
</div>

<h2>Rules</h2>
<div class="btn-group d-flex mb-1" role="group">
  <span class="input-group-text">X Wins</span>
  {#each SETTINGS_X as s, i}
    <button onclick={() => { winnerX.value = i + 1 }} class:active={winnerX.value === i + 1} class="w-100 btn btn-outline-{s[1]}">{s[0]}</button>
  {/each}
</div>
<div class="btn-group d-flex mb-1" role="group">
  <span class="input-group-text">O Wins</span>
  {#each SETTINGS_O as s, i}
    <button onclick={() => { winnerO.value = i + 1 }} class:active={winnerO.value === i + 1} class="w-100 btn btn-outline-{s[1]}">{s[0]}</button>
  {/each}
</div>
<div class="btn-group d-flex mb-2" role="group">
  <span class="input-group-text">Tie</span>
  {#each SETTINGS_T as s, i}
    <button onclick={() => { winnerTie.value = i + 1 }} class:active={winnerTie.value === i + 1} class="w-100 btn btn-outline-{s[1]}">{s[0]}</button>
  {/each}
</div>
<div class="input-group d-flex mb-2" role="group">
  <button onclick={() => {
    winnerX.value = winnerX.value === 3 ? 3 : winnerX.value ^ 3
    winnerO.value = winnerO.value === 3 ? 3 : winnerO.value ^ 3
    winnerTie.value = winnerTie.value === 3 ? 3 : winnerTie.value ^ 3
  }} class="flex-grow-1 btn btn-outline-secondary">Invert</button>
  <span class="input-group-text">Presets: X wants</span>
  {#each PRESETS as p}
    <button
      onclick={() => { winnerX.value = p[0]; winnerO.value = p[1]; winnerTie.value = p[2] }}
      class:active={winnerX.value === p[0] && winnerO.value === p[1] && winnerTie.value === p[2]}
      class="flex-grow-1 btn btn-outline-{p[3]}">{p[4]}</button>
  {/each}
</div>

<h3>Prefer Outcome Timing <span class="badge text-bg-secondary">TODO</span></h3>

<div class="btn-group d-flex mb-1" role="group">
  <span class="input-group-text">Win</span>
  <button class="w-100 btn btn-outline-primary active">Earlier</button>
  <button class="w-100 btn btn-outline-warning disabled" title="not implemented yet">Anytime</button>
  <button class="w-100 btn btn-outline-success disabled" title="not implemented yet">Later</button>
</div>
<div class="btn-group d-flex mb-1" role="group">
  <span class="input-group-text">Tie</span>
  <button class="w-100 btn btn-outline-primary disabled" title="not implemented yet">Earlier</button>
  <button class="w-100 btn btn-outline-warning active">Anytime</button>
  <button class="w-100 btn btn-outline-success disabled" title="not implemented yet">Later</button>
</div>
<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Lose</span>
  <button class="w-100 btn btn-outline-primary disabled" title="not implemented yet">Earlier</button>
  <button class="w-100 btn btn-outline-warning disabled" title="not implemented yet">Anytime</button>
  <button class="w-100 btn btn-outline-success active">Later</button>
</div>
