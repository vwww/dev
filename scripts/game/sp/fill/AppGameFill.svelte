<script>
import boards from './boards.txt'
import { Solver } from './Solver'
import { pStore } from '../../../util/svelte'

const BOARDS = boards.trim().split(/[\r\n]+/)

const ROWS = 8
const COLS = 8

const solver = new Solver(ROWS, COLS)

const gridLevel = pStore('game/sp/fill/gridLevel', undefined)
const gridText = pStore('game/sp/fill/gridText', '')
let gridTextTxt
let cells = Array(ROWS).fill().map(r => Array(COLS).fill().map(c => { r, c }))
let status

function updateRendering () {
  const root = solver.getRoot()
  status = 0

  for (let r = 0; r < ROWS; r++) {
    const row = cells[r]
    for (let c = 0; c < COLS; c++) {
      const cell = solver.getCell(r, c)
      const cellInfo = {
        r,
        c,
        isSolved: cell.solver.mYes,
        reachesRoot: root && root.solver.ufFind() === cell.solver.ufFind(),
        isRoot: cell.isRoot,
        active: cell.active,
        moves: cell.solver.moves,
      }
      if (cellInfo.active && !cellInfo.reachesRoot) {
        status++
      }
      row[c] = cellInfo
    }
  }

  if (!root) status = -1

  cells = cells
}

function recompute () {
  solver.solve()
  updateRendering()
  $gridText = gridTextTxt = solver.toString()
}

function loadString (s) {
  solver.loadString(s)
  recompute()
}

loadString($gridText)
</script>

<div class="input-group mb-2">
  <div class="input-group-prepend">
    <span class="input-group-text">Load level</span>
  </div>
  <input type="number" on:change={function () { loadString(BOARDS[+this.value - 1]) }} min="1" max={BOARDS.length} bind:value={$gridLevel} class="form-control">
</div>

<textarea class="form-control mb-3" bind:value={gridTextTxt} on:change={loadString(gridTextTxt)} maxlength="280" placeholder="Grid string"></textarea>

{#if !status}
  <div class="alert alert-success" role="alert">
    <h4 class="alert-heading">Valid solution</h4>
  </div>
{:else if status === -1}
  <div class="alert alert-warning" role="alert">
    <h4 class="alert-heading">No start cell</h4>
    The start cell is not set.
  </div>
{:else}
  <div class="alert alert-danger" role="alert">
    <h4 class="alert-heading">Unsolved</h4>
    Unsolved count: {status}
  </div>
{/if}

<table id="fill-table">
  {#each cells as row}
    <tr>
      {#each row as cell}
        <td
          class="fill"
          class:fill-solved={cell.isSolved}
          class:fill-to-root={!cell.isRoot && cell.reachesRoot}
          class:fill-root={cell.isRoot}
          class:fill-disabled={!cell.active}

          on:click={() => {
            solver.invertCell(cell.r, cell.c)
            recompute()
          }}

          on:contextmenu|preventDefault={() => {
            solver.setRoot(cell.r, cell.c)
            recompute()
            return false
          }}>
        {#each cell.moves as move}
          <div class={['', 'fill-m', 'fill-y'][move]}></div>
        {/each}
        </td>
      {/each}
    </tr>
  {/each}
</table>

<style>
.fill {
  width: 10vmin;
  height: 10vmin;
  border: 0.5vmin solid black;
  background-color: #aaa;
  position: relative;
}

.fill * {
display: block;
position: absolute;
}

.fill :nth-child(1) { width: 30%; height: 50%; left: 35%; top: 0; }
.fill :nth-child(2) { width: 30%; height: 50%; left: 35%; bottom: 0; }
.fill :nth-child(3) { width: 50%; height: 30%; left: 0; top: 35%; }
.fill :nth-child(4) { width: 50%; height: 30%; right: 0; top: 35%; }

.fill .fill-y { background-color: #444; }
.fill .fill-m { background-color: #888; }

/*
inspired by
https://codepen.io/dom111/full/mwJwmM/
https://github.com/dom111/flow-free/blob/master/flow.css
*/

.fill-root { background-color: #da8; }
.fill-solved { background-color: #edc; }
.fill-solved.fill-to-root { background-color: #cec; }
.fill-root.fill-solved { background-color: #aea; }
.fill-disabled { background-color: #eee; }
</style>