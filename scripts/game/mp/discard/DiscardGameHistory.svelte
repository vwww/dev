<script>
import { getCardName } from './DiscardPlay'

export let results
export let ll
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <b>Survived ({pastGame.survived.length}):</b>
      {#each pastGame.survived as p}
        <br>
        #{p.rank}: <span class="badge bg-{p.rank > 1 ? 'warning' : 'success'}">{p.name}</span>
        <span class="badge bg-dark">{getCardName(p.hand, ll)}</span>
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge bg-light">{getCardName(d, ll)}</span>
        {/each}
      {/each}
      <br>
      <b>Eliminated ({pastGame.eliminated.length}):</b>
      {#each pastGame.eliminated as p, i}
        <br>
        #{pastGame.survived.length + i + 1}:
        <span class="badge bg-danger">{p.name}</span>
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge bg-light">{getCardName(d, ll)}</span>
        {/each}
      {/each}
    </li>
  {:else}
    <li class="list-group-item">
      No past games!
    </li>
  {/each}
</ul>
