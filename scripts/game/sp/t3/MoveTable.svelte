<script>
export let boardHistory
export let moveStack
export let moveLength
export let winner
export let winnerMap
export let getMemo

import MoveTableRow from './MoveTableRow'

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
