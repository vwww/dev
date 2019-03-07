<script lang="ts">
import { Winner, type WinnerMap } from '@gc/t3/game'
import { type GetMemoType } from './AppGameT3.svelte'
import MoveTableRow from './MoveTableRow.svelte'

interface Props {
  boardHistory: number[]
  moveStack: number[]
  moveLength: number
  winner: Winner
  winnerMap: WinnerMap
  getMemo: GetMemoType | undefined
}

const {
  boardHistory,
  moveStack,
  moveLength,
  winner,
  winnerMap,
  getMemo
}: Props = $props()

const moves = [0, 1, 2, 3, 4, 5, 6, 7, 8]
</script>

<table class="table table-striped table-bordered">
  <thead>
    <tr>
      <th>Move</th>
      <th>Paths</th>
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
