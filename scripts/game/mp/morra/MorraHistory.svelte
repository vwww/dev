<script lang="ts">
import { MorraGameHistory } from './MorraGame'

export let results: MorraGameHistory[]
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      <div>
        Total:
        {#if pastGame.moveRnd >= 0}{(pastGame.moveSum - pastGame.moveRnd).toLocaleString()} + {pastGame.moveRnd.toLocaleString()} ={/if}
        {pastGame.moveSum.toLocaleString()} &equiv; <span class="badge badge-success">{pastGame.winner}</span> (mod {pastGame.teams.length})
      </div>
      {#each pastGame.teams as team, id}
        <div>
          <span class="badge mr-1 badge-{team.winner ? 'success' : 'danger'}">#{id}</span> <span class="badge badge-primary">{team.moveSum}</span>:
          {#each team.players as player}
            <span class="badge mr-1 badge-secondary">{player.name} ({player.cn})</span>
            <span class="badge mr-2 badge-primary">{player.move}</span>
          {/each}
        </div>
      {/each}
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
