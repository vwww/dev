<script lang="ts">
import type { CheatGameHistory } from './CheatGame2.svelte'

interface Props {
  results: CheatGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Ranks:
        {#each pastGame.players as p, id}
          <span class="badge text-bg-{id ? 'secondary' : 'primary'}">
            {p.name} ({p.cn})
          </span>
        {/each}
      </div>
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
