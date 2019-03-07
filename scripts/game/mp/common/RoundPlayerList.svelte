<script lang="ts">
import type { TurnBasedClient } from './game/TurnBasedGame.svelte'

interface Props {
  localClient: TurnBasedClient
  inGame: ArrayLike<TurnBasedClient>
  inQueue: ArrayLike<TurnBasedClient>
}

const { localClient, inGame, inQueue }: Props = $props()
</script>

{#snippet playerBadge(p: TurnBasedClient, badgeClass: string)}
  <span class="badge text-bg{p == localClient ? '' : '-outline'}-{badgeClass} me-1">{p.name} ({p.cn})</span>
{/snippet}

<div>
  In game:
  {#each inGame as roundPlayer}
    {@render playerBadge(roundPlayer, roundPlayer.ready ? 'info' : 'primary')}
  {:else}
    nobody
  {/each}
</div>

<div>
  Queue:
  {#each inQueue as queuedPlayer}
    {@render playerBadge(queuedPlayer, queuedPlayer.ready ? 'info' : 'secondary')}
  {:else}
    nobody
  {/each}
</div>
