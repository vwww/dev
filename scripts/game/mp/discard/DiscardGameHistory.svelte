<script lang="ts">
import type { DiscardGameHistory } from './DiscardGame2.svelte'

import { getCardName } from './DiscardPlay.svelte'

interface Props {
  results: ArrayLike<DiscardGameHistory>
  ll: boolean
}

const { results, ll }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <b>Survived ({pastGame.survived.length}):</b>
      {#each pastGame.survived as p}
        {@const outline = p.isMe ? '' : '-outline'}
        <br>
        #{p.rank}: <span class="badge text-bg{outline}-{p.rank > 1 ? 'warning' : 'success'}">{p.name}</span>
        <span class="badge text-bg{outline}-dark">{getCardName(p.hand, ll)}</span>
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge text-bg-light">{getCardName(d, ll)}</span>
        {/each}
      {/each}
      <br>
      <b>Eliminated ({pastGame.eliminated.length}):</b>
      {#each pastGame.eliminated as p, i}
        {@const outline = p.isMe ? '' : '-outline'}
        <br>
        #{pastGame.survived.length + i + 1}:
        <span class="badge text-bg{outline}-danger">{p.name}</span>
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge text-bg-light">{getCardName(d, ll)}</span>
        {/each}
      {/each}
    </li>
  {:else}
    <li class="list-group-item">
      No past games!
    </li>
  {/each}
</ul>
