<script lang="ts" context="module">
export type CellInfo = {
  r: number
  c: number
  isSolved: number
  reachesRoot: boolean | undefined
  isRoot: boolean
  active: boolean
  moves: MoveType[]
  browseNum?: number
}
type CellCallback = (_: CellInfo) => void
</script>

<script lang="ts">
import { MoveType } from './Move'

export let cells: CellInfo[][]
export let onLeftClickCell: CellCallback = () => {}
export let onRightClickCell: CellCallback = () => {}

function alignh (cell: CellInfo): string {
  return cell.moves[2] ? cell.moves[3] ? 'center' : 'right' : 'left'
}

function alignv (cell: CellInfo): string {
  return cell.moves[0] ? cell.moves[1] ? 'center' : 'bottom' : 'top'
}
</script>

<table id="fill-table">
  {#each cells as row}
    <tr>
      {#each row as cell}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <td
          class="fill"
          class:fill-solved={cell.isSolved}
          class:fill-to-root={!cell.isRoot && cell.reachesRoot}
          class:fill-root={cell.isRoot}
          class:fill-disabled={!cell.active}
          style={cell.browseNum === undefined ? undefined :
            !cell.browseNum ? 'text-align: center'
              : `text-align: ${alignh(cell)}; vertical-align: ${alignv(cell)}`}
          on:click={() => onLeftClickCell(cell)}
          on:contextmenu|preventDefault={() => (onRightClickCell(cell), true)}>
        {#each cell.moves as move}
          <div class={['', 'fill-m', 'fill-y'][move]}></div>
        {/each}
        {cell.browseNum ?? ''}
        </td>
      {/each}
    </tr>
  {/each}
</table>

<style>
#fill-table {
  margin-left: auto;
  margin-right: auto;
}

.fill {
  width: 10vmin;
  height: 10vmin;
  border: 0.5vmin solid black;
  background-color: #aaa;
  position: relative;

  color: #000;
  font: 2.5vmin monospace;
}

.fill div {
  position: absolute;
}

.fill :nth-child(1) { width: 30%; height: 51%; left: 35%; top: 0; }
.fill :nth-child(2) { width: 30%; height: 51%; left: 35%; bottom: 0; }
.fill :nth-child(3) { width: 51%; height: 30%; left: 0; top: 35%; }
.fill :nth-child(4) { width: 51%; height: 30%; right: 0; top: 35%; }

.fill .fill-y { background-color: #444; }
.fill .fill-m { background-color: #888; }

/*
inspired by
https://codepen.io/dom111/full/mwJwmM/
https://github.com/dom111/flow-free/blob/64d661812b6b5f155756c2298b53b226eb7dc719/flow.css
*/

.fill-root { background-color: #da8; }
.fill-solved { background-color: #edc; }
.fill-solved.fill-to-root { background-color: #cec; }
.fill-root.fill-solved { background-color: #aea; }
.fill-disabled { background-color: #eee; }
</style>
