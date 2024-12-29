<script lang="ts">
import type { TurnBasedClient } from './game/TurnBasedGame'

interface Props {
  inGame: ArrayLike<TurnBasedClient>
  inQueue: ArrayLike<TurnBasedClient>
}

const { inGame, inQueue }: Props = $props()
</script>

<div>
  In game:
  {#each inGame as roundPlayer}
    <span class="badge text-bg-{roundPlayer.ready ? 'info' : 'primary'} me-1">{roundPlayer.name} ({roundPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>

<div>
  Queue:
  {#each inQueue as queuedPlayer}
    <span class="badge text-bg-{queuedPlayer.ready ? 'info' : 'secondary'} me-1">{queuedPlayer.name} ({queuedPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>
