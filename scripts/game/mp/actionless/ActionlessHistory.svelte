<script lang="ts">
import type { ActionlessGameHistory, ActionlessGameHistoryWin } from './ActionlessGame.svelte'

interface Props {
  results: ActionlessGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      {#snippet winPlayers(win: ActionlessGameHistoryWin)}
        {#each win.players as player, i}
          <span class="badge me-1 text-bg{i == win.meIndex ? '' : '-outline'}-{win.win ? 'success' : 'danger'}">{player}</span>
        {/each}
      {/snippet}
      {#if pastGame.playerCount == pastGame.wins.length}
        <div>
          FFA:
          {#each pastGame.wins as win}
            {@render winPlayers(win)}
          {/each}
        </div>
      {:else}
        {#each pastGame.wins as win}
          <div>
            Team {win.id}:
            {@render winPlayers(win)}
          </div>
        {/each}
      {/if}
    </li>
  {:else}
    <li class="list-group-item">No past games!</li>
  {/each}
</ul>
