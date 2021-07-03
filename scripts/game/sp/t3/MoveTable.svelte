<script lang="ts">
import { Winner, WinnerMap } from '../../common/t3/game'
import { GetMemoType } from './AppGameT3.svelte'
import MoveTableRow from './MoveTableRow.svelte'

export let boardHistory: number[]
export let moveStack: number[]
export let moveLength: number
export let winner: Winner
export let winnerMap: WinnerMap
export let getMemo: GetMemoType | undefined

const moves = [0, 1, 2, 3, 4, 5, 6, 7, 8]
</script>

<table class="table table-striped table-bordered">
  <thead>
    <tr>
      <th>Move</th>
      <th>Position</th>
      <th>X Win</th>
      <th>O Win</th>
      <th>Tie</th>
    </tr>
  </thead>
  <tbody>
    {#each moves as i}
      <MoveTableRow {i} {boardHistory} {moveStack} {moveLength} {winner} {winnerMap} {getMemo} />
    {/each}
  </tbody>
</table>
