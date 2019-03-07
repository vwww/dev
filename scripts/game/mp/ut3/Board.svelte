<script>
export let boardState
export let markHover
export let onMove

const cellNumbers = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]

function cellClass (board, i, legalMove) {
  const v = (board >> (i << 1)) & 3
  return v || (legalMove ? 3 : 0)
}
</script>

<table class={`outerGrid m${markHover}`}>
  {#each cellNumbers as row}
    <tr>
    {#each row as i}
      <td>
        <table class={`innerGrid p${cellClass(boardState.board, i, boardState.boardMustMove < 0 || boardState.boardMustMove === i)}`}>
          {#each cellNumbers as row}
            <tr>
            {#each row as j}
              <td class={`innerCell p${cellClass(boardState.boards[i], j, !((boardState.boardRestrict[i] >> j) & 1))}`}
                class:canMove={markHover}
                on:click={() => onMove(i, j)} />
            {/each}
            </tr>
          {/each}
        </table>
      </td>
    {/each}
    </tr>
  {/each}
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
}

.innerGrid.p1 { background-color: #008000 }
.innerGrid.p2 { background-color: #ffa07a }
.innerGrid.p3 { background-color: #add8e6 }

.innerCell {
  width: 6vmin;
  height: 6vmin;
  opacity: 0.6;
}

.innerCell.p0 { background-color: #696969 }
.innerCell.p1 { background-color: #9acd32; opacity: 1; }
.innerCell.p2 { background-color: #ff7f50; opacity: 1; }
.innerCell.p3 { background-color: #98afc7 }

.innerCell.canMove.p0 { cursor: not-allowed }
.innerCell.canMove.p3 { cursor: pointer }
.m1 .innerCell.p3:hover { background-color: #9acd32 }
.m2 .innerCell.p3:hover { background-color: #ff7f50 }
</style>
