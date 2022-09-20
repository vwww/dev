<script lang="ts">
import { TurnBasedClient } from './game/TurnBasedGame'

export let inGame: ArrayLike<TurnBasedClient>
export let inQueue: ArrayLike<TurnBasedClient>
</script>

<div>
  In game:
  {#each inGame as roundPlayer}
    <span class="badge bg-{roundPlayer.ready ? 'info' : 'primary'} me-1">{roundPlayer.name} ({roundPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>

<div>
  Queue:
  {#each inQueue as queuedPlayer}
    <span class="badge bg-{queuedPlayer.ready ? 'info' : 'secondary'} me-1">{queuedPlayer.name} ({queuedPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>
