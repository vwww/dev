<script lang="ts">
import boards from './boards.txt'

import FillTable, { CellInfo } from './FillTable.svelte'

import { Solver } from './Solver'
import { pStore } from '../../../util/svelte'

const BOARDS = boards.trim().split(/[\r\n]+/)

const ROWS = 10
const COLS = 8

const solver = new Solver(ROWS, COLS)

const gridLevel = pStore('game/sp/fill/gridLevel', undefined)
const gridText = pStore('game/sp/fill/gridText', '')
const maxComplexity = pStore('game/sp/fill/maxComplexity', 7)
let gridTextTxt = ''
let cells: CellInfo[][] = Array(ROWS).fill(undefined).map(_ => Array(COLS).fill(undefined).map(_ => undefined as unknown as CellInfo))
let status: number | undefined
let statusUnsolvable = false
let totalCells = 0

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

  cells = cells
}

function recompute () {
  solver.solve($maxComplexity)
  updateRendering()
  $gridText = gridTextTxt = solver.toString()
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

loadString($gridText)

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
            unsolvable.push(i + 101)
            break OUTER
          }
        }
      }
    }

    console.log(`${unsolvable.length} unsolved (${BOARDS.length - unsolvable.length}/${BOARDS.length} solved)`)
    console.log(unsolvable)
  }
}

function onBoardChange (this: HTMLInputElement) { loadBoard(+this.value - 101) }
</script>

<div class="input-group mb-2">
  <span class="input-group-text">Load level</span>
  <input type="number" on:change={onBoardChange} min="101" max={BOARDS.length + 100} bind:value={$gridLevel} class="form-control">
</div>

<textarea class="form-control mb-3" bind:value={gridTextTxt} on:change={() => loadString(gridTextTxt)} maxlength="280" placeholder="Grid string"></textarea>

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
  <input type="number" on:change={recompute} min="0" max="100" bind:value={$maxComplexity} class="form-control">
</div>
