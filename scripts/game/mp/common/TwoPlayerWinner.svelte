<script>
export let results
export let p0Win = 'X wins'
export let p1Win = 'O wins'
export let draw = 'draw'
export let winEarly = 'by forfeit'
export let drawEarly = 'by agreement'

function winClass(winner) {
  return !winner ? 'success' : winner === 1 ? 'danger' : 'secondary'
}
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
{#each results as result}
  <li class="list-group-item">
    <span class={`badge bg-${winClass(result.winner)}`}>{result.p0Name}</span> vs <span class={`badge bg-${winClass(1 - result.winner)}`}>{result.p1Name}</span>
    <p>Ply {result.ply}: {!result.winner ? p0Win : result.winner === 1 ? p1Win : draw} {result.earlyEnd ? result.winner < 2 ? winEarly : drawEarly : ''}</p>
  </li>
{:else}
  <li class="list-group-item">
    No past games!
  </li>
{/each}
</ul>
