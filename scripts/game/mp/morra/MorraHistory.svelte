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
        {pastGame.moveSum} &equiv; <span class="badge text-bg-success">{pastGame.winner}</span> (mod {pastGame.teams.length})
      </div>
      {#each pastGame.teams as team, id}
        {@const outline = team.meIndex != null ? '' : '-outline'}
        <div>
          <span class="badge me-1 text-bg{outline}-{team.winner ? 'success' : 'danger'}">#{id}</span>
          {#if pastGame.teams.length < pastGame.playerCount}<span class="badge text-bg{outline}-primary">{team.moveSum}</span>:{/if}
          {#each team.players as player, i}
            {@const outline = team.meIndex == i ? '' : '-outline'}
            <div class="d-inline-block">
              <span class="badge me-1 text-bg{outline}-secondary">{player.name} ({player.cn})</span>
              <span class="badge me-2 text-bg{outline}-primary">{player.move}</span>
            </div>
          {/each}
        </div>
      {/each}
      {#if pastGame.moveRnd >= 0}
        <div>Random: <span class="badge me-2 text-bg-outline-primary">{pastGame.moveRnd}</span></div>
      {/if}
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
