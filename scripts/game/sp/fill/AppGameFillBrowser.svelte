<script lang="ts">
import boards from './boards.json'

import FillTable, { type CellInfo } from './FillTable.svelte'
import { DELTA, MoveType } from './Move'
import { pState } from '@/util/svelte.svelte'

const BOARDS = boards

function generateCells (index: number): CellInfo[][] {
  const board = BOARDS[index]
  if (!board) return []

  const R = board.length
  const C = board[0].length

  return board.map((row, r) => row.map((cell, c) => ({
    r,
    c,
    isSolved: cell ? 1 : 0,
    reachesRoot: !!cell,
    isRoot: cell === 1,
    active: !!cell,
    moves: cell ? DELTA.map(([dr, dc]) => {
      const nr = r + dr
      const nc = c + dc
      if (nr >= 0 && nc >= 0 && nr < R && nc < C) {
        const ocell = board[nr][nc]
        if (ocell && Math.abs(cell - ocell) === 1) {
          return MoveType.YES
        }
      }
      return MoveType.NO
    }) : [MoveType.NO, MoveType.NO, MoveType.NO, MoveType.NO],
    browseNum: cell,
  })))
}

const gridLevel = pState('game/sp/fill/browse/gridLevel', 1)
const gridStage = pState('game/sp/fill/browse/gridStage', 1)
const cells = $derived(generateCells((gridLevel.value - 1) * 100 + gridStage.value - 1))
</script>

<div class="row">
  <div class="col-12 col-md-6">
    <label class="w-100">
      Level
      <input type="number"
        class="form-control"
        min="1" max={BOARDS.length / 100}
        bind:value={gridLevel.value}>
      <input type="range"
        class="form-range"
        min="1" max={BOARDS.length / 100}
        bind:value={gridLevel.value}>
    </label>
  </div>
  <div class="col-12 col-md-6">
    <label class="w-100">
      Stage
      <input type="number"
        class="form-control"
        min="1" max="100"
        bind:value={gridStage.value}>
      <input type="range"
        class="form-range"
        min="1" max="100"
        bind:value={gridStage.value}>
    </label>
  </div>
</div>

<FillTable {cells} />
