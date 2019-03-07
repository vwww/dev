<script lang="ts">
import boards from './boards.txt'

import FillTable, { type CellInfo } from './FillTable.svelte'

import { Solver } from './Solver'
import { pState } from '@/util/svelte.svelte'

const BOARDS = boards.trim().split(/[\r\n]+/)

const LEVEL_OFFSET = 101
const ROWS = 10
const COLS = 8

const solver = new Solver(ROWS, COLS)

const gridLevel = pState('game/sp/fill/gridLevel', LEVEL_OFFSET)
const gridText = pState('game/sp/fill/gridText', '')
const maxComplexity = pState('game/sp/fill/maxComplexity', 7)
let gridTextTxt = $state('')
let cells: CellInfo[][] = $state(Array.from({ length: ROWS }, () => Array(COLS)))
let status: number | undefined = $state()
let statusUnsolvable = $state(false)
let totalCells = $state(0)

function updateRendering () {
  const root = solver.getRoot()
  status = 0
  statusUnsolvable = true
  totalCells = 0

  for (let r = 0; r < ROWS; r++) {
    const row = cells[r]
    for (let c = 0; c < COLS; c++) {
      const cell = solver.getCell(r, c)
      const cellInfo: CellInfo = {
        r,
        c,
        isSolved: cell.solver.mYes,
        reachesRoot: root && root.solver.ufFind() === cell.solver.ufFind(),
        isRoot: cell.isRoot,
        active: cell.active,
        moves: cell.solver.moves,
      }
      if (cellInfo.active) {
        totalCells++
        if (!cellInfo.isSolved) statusUnsolvable = false
        if (!cellInfo.reachesRoot) status++
      }
      row[c] = cellInfo
    }
  }

  if (!root) status = -1
}

function recompute () {
  solver.solve(maxComplexity.value)
  updateRendering()
  gridText.value = gridTextTxt = solver.toString()
}

function loadString (s: string) {
  solver.loadString(s)
  recompute()
}

function loadBoard (b: number) {
  if (b >= 0 && b < BOARDS.length) {
    loadString(BOARDS[b])
  }
}

loadString(gridText.value)

// dev only
if (process.env.NODE_ENV !== 'production') {
  (window as any).test = function (maxComplexity = 1) {
    const testSolver = new Solver(ROWS, COLS)
    const unsolvable = []

    for (let i = 0; i < BOARDS.length; i++) {
      testSolver.loadString(BOARDS[i])
      testSolver.solve(maxComplexity)

      const rootUF = testSolver.getRoot()?.solver.ufFind()

      OUTER:
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = testSolver.getCell(r, c)

          if (cell.active && rootUF !== cell.solver.ufFind()) {
            unsolvable.push(i + LEVEL_OFFSET)
            break OUTER
          }
        }
      }
    }

    console.log(`${unsolvable.length} unsolved (${BOARDS.length - unsolvable.length}/${BOARDS.length} solved)`)
    console.log(unsolvable)
  }
}

function onBoardChange () { loadBoard(gridLevel.value - LEVEL_OFFSET) }
</script>

<div class="row">
  <div class="col-8 col-sm-9 col-md-10">
    <input type="number"
      class="form-control"
      min={LEVEL_OFFSET} max={BOARDS.length + (LEVEL_OFFSET - 1)}
      bind:value={gridLevel.value}>
    <input type="range"
      class="form-range"
      min={LEVEL_OFFSET} max={BOARDS.length + (LEVEL_OFFSET - 1)}
      bind:value={gridLevel.value}>
  </div>
  <div class="col-4 col-sm-3 col-md-2">
    <button class="btn btn-primary w-100" onclick={onBoardChange}>Load Stage</button>
  </div>
</div>

<textarea class="form-control mb-3" bind:value={gridTextTxt} onchange={() => loadString(gridTextTxt)} maxlength="280" placeholder="Grid string"></textarea>

{#if !status}
  <div class="alert alert-success" role="alert">
    <h4 class="alert-heading">Valid solution</h4>
    Solved: {totalCells}
  </div>
{:else if status === -1}
  <div class="alert alert-warning" role="alert">
    <h4 class="alert-heading">No start cell</h4>
    The start cell is not set. Total: {totalCells}
  </div>
{:else}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Unsolved</h4>
    Unsolved count: {status}/{totalCells}{statusUnsolvable ? ' (Unsolvable)' : ''}
  </div>
{/if}

<FillTable
  {cells}
  onLeftClickCell={cell => {
    solver.invertCell(cell.r, cell.c)
    recompute()
  }}
  onRightClickCell={cell => {
    solver.setRoot(cell.r, cell.c)
    recompute()
  }}
/>

<div class="input-group mt-2 mb-3">
  <span class="input-group-text">Maximum Search Depth</span>
  <input type="number" onchange={recompute} min="0" max="100" bind:value={maxComplexity.value} class="form-control">
</div>
