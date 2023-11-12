<script lang="ts">
import { AGameHistory } from './ActionlessGame'

export let results: AGameHistory[]
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      {#if pastGame.playerCount == pastGame.wins.length}
        <div>
          FFA:
          {#each pastGame.wins as win}
            {#each win.players as player}
              <span class="badge me-1 text-bg-{win.win ? 'success' : 'danger'}">{player.name} ({player.cn})</span>
            {/each}
          {/each}
        </div>
      {:else}
        {#each pastGame.wins as win}
          <div>
            Team {win.id}:
            {#each win.players as player}
              <span class="badge me-1 text-bg-{win.win ? 'success' : 'danger'}">{player.name} ({player.cn})</span>
            {/each}
          </div>
        {/each}
      {/if}
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
