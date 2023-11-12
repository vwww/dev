<script lang="ts">
import { TPHistoryEntry } from './game/TwoPlayerGame'

export let results: ArrayLike<TPHistoryEntry>
export let p0Win = 'X wins'
export let p1Win = 'O wins'
export let draw = 'draw'
export let winEarly = 'by forfeit'
export let drawEarly = 'by agreement'

function winClass (winner: number): string {
  return !winner ? 'success' : winner === 1 ? 'danger' : 'secondary'
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
{#each results as result}
  <li class="list-group-item">
    <span class="badge text-bg-{winClass(result.winner)}">{result.p0Name}</span> vs <span class="badge text-bg-{winClass(1 - result.winner)}">{result.p1Name}</span>
    <p>Ply {result.ply}: {!result.winner ? p0Win : result.winner === 1 ? p1Win : draw} {result.earlyEnd ? result.winner < 2 ? winEarly : drawEarly : ''}</p>
  </li>
{:else}
  <li class="list-group-item">
    No past games!
  </li>
{/each}
</ul>
