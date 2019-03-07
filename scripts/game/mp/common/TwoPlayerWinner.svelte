<script lang="ts">
import type { TwoPlayerTurnHistory } from './game/TwoPlayerTurnGame.svelte'

interface Props {
  results: ArrayLike<TwoPlayerTurnHistory>
  p0Win?: string
  p1Win?: string
  draw?: string
  winEarly?: string
  drawEarly?: string
}

let {
  results,
  p0Win = 'X wins',
  p1Win = 'O wins',
  draw = 'draw',
  winEarly = 'by forfeit',
  drawEarly = 'by agreement',
}: Props = $props()

function winClass (winner: number): string {
  return !winner ? 'success' : winner === 1 ? 'danger' : 'secondary'
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
{#each results as result}
  <li class="list-group-item">
    <span class="badge text-bg{result.meIndex == 0 ? '' : '-outline'}-{winClass(result.winner)}">{result.p0Name}</span>
    vs
    <span class="badge text-bg{result.meIndex == 1 ? '' : '-outline'}-{winClass(1 - result.winner)}">{result.p1Name}</span>:
    {!result.winner ? p0Win : result.winner === 1 ? p1Win : draw} {result.earlyEnd ? result.winner < 2 ? winEarly : drawEarly : ''}
    on ply {result.ply}
  </li>
{:else}
  <li class="list-group-item">
    No past games!
  </li>
{/each}
</ul>
