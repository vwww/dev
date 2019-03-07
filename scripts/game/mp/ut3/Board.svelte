<script lang="ts">
import type { BoardState } from './UT3Game.svelte'

interface Props {
  boardState: BoardState
  markHover: number
  onMove: (row: number, col: number) => void
}

const { boardState, markHover, onMove }: Props = $props()

const cellNumbers = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

function cellClass (board: number, i: number, legalMove: boolean) {
  const v = (board >> (i << 1)) & 3
  return v || (legalMove ? 3 : 0)
}
</script>

<table class="outerGrid m{markHover}">
  <tbody>
    {#each cellNumbers as row}
      <tr>
      {#each row as i}
        <td>
          <table class="innerGrid p{cellClass(boardState.board, i, boardState.boardMustMove < 0 || boardState.boardMustMove === i)}">
            <tbody>
              {#each cellNumbers as row}
                <tr>
                {#each row as j}
                  <td class="innerCell p{cellClass(boardState.boards[i], j, !((boardState.boardRestrict[i] >> j) & 1))}"
                    onclick={() => onMove(i, j)}></td>
                {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </td>
      {/each}
      </tr>
    {/each}
  </tbody>
</table>

<style>
.outerGrid {
  margin: auto;
}

.innerGrid {
  margin: 1vmin;
  border-collapse: separate;
  border-spacing: .6vmin;
  background-color: #a9a9a9;

  &.p1 { background-color: #008000 }
  &.p2 { background-color: #ffa07a }
  &.p3 { background-color: #add8e6 }
}

.innerCell {
  width: 6vmin;
  height: 6vmin;
  opacity: 0.6;

  &.p0 { background-color: #696969 }
  &.p1 { background-color: #9acd32; opacity: 1; }
  &.p2 { background-color: #ff7f50; opacity: 1; }
  &.p3 { background-color: #98afc7 }

  .outerGrid.m1 &, .outerGrid.m2 & {
    cursor: not-allowed;
    &.p3 { cursor: pointer }
  }
  &.p3:hover {
    .m1 & { background-color: #9acd32 }
    .m2 & { background-color: #ff7f50 }
  }
}
</style>
