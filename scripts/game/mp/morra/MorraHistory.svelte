<script lang="ts">
import type { MorraGameHistory } from './MorraGame.svelte'

interface Props {
  results: MorraGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Total:
        {#if pastGame.moveRnd >= 0}{(pastGame.moveSum - pastGame.moveRnd).toLocaleString()} + {pastGame.moveRnd.toLocaleString()} ={/if}
        {pastGame.moveSum.toLocaleString()} &equiv; <span class="badge text-bg-success">{pastGame.winner}</span> (mod {pastGame.teams.length})
      </div>
      {#each pastGame.teams as team, id}
        <div>
          <span class="badge me-1 text-bg-{team.winner ? 'success' : 'danger'}">#{id}</span> <span class="badge text-bg-primary">{team.moveSum}</span>:
          {#each team.players as player}
            <span class="badge me-1 text-bg-secondary">{player.name} ({player.cn})</span>
            <span class="badge me-2 text-bg-primary">{player.move}</span>
          {/each}
        </div>
      {/each}
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
