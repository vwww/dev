<script lang="ts">
interface RoundListSpectator {
  name: string
  cn: number
}

interface RoundListPlayer extends RoundListSpectator {
  ready?: unknown
}

interface Props {
  localClient: RoundListPlayer
  inGame: ArrayLike<RoundListPlayer>
  inQueue?: ArrayLike<RoundListPlayer>
  spectators?: ArrayLike<RoundListSpectator>
}

const { localClient, inGame, inQueue, spectators }: Props = $props()
</script>

{#snippet playerBadge(p: RoundListPlayer, badgeClass: string)}
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

{#if inQueue}
  <div>
    Queue:
    {#each inQueue as queuedPlayer}
      {@render playerBadge(queuedPlayer, queuedPlayer.ready ? 'info' : 'secondary')}
    {:else}
      nobody
    {/each}
  </div>
{/if}

{#if spectators?.length}
  <div>
    Spectating:
    {#each spectators as roundPlayer}
      {@render playerBadge(roundPlayer, 'secondary')}
    {/each}
  </div>
{/if}
