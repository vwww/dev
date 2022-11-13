<script lang="ts">
import boards from './boards.json'

import FillTable, { CellInfo } from './FillTable.svelte'
import { DELTA, MoveType } from './Move'
import { pStore } from '@/util/svelte'

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

const gridLevel = pStore('game/sp/fill/browse/gridLevel', 1)
const gridStage = pStore('game/sp/fill/browse/gridStage', 1)
$: cells = generateCells(($gridLevel - 1) * 100 + $gridStage - 1)
</script>

<div class="input-group mb-5">
  <span class="input-group-text">Level</span>
  <input type="number"
    class="form-control"
    min="1" max={BOARDS.length / 100}
    bind:value={$gridLevel} >
  <span class="input-group-text">Stage</span>
  <input type="number"
    class="form-control"
    min="1" max="100"
    bind:value={$gridStage} >
</div>

<FillTable {cells} />
