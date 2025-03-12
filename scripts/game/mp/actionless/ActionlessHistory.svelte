<script lang="ts">
import type { AGameHistory, AGameHistoryWin } from './ActionlessGame2.svelte'

interface Props {
  results: AGameHistory[]
}

const { results }: Props = $props()
</script>

<ul class="list-group list-group-flush overflow-auto" style="max-height: 15rem">
  {#each results as pastGame}
    <li class="list-group-item">
      {#snippet winPlayers(win: AGameHistoryWin)}
        {#each win.players as player}
          <span class="badge me-1 text-bg-{win.win ? 'success' : 'danger'}">{player}</span>
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
