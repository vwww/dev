<script>
export let inGame
export let inQueue
</script>

<div>
  In game:
  {#each inGame as roundPlayer}
    <span class="badge badge-{roundPlayer.ready ? 'info' : 'primary'} mr-1">{roundPlayer.name} ({roundPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>

<div>
  Queue:
  {#each inQueue as queuedPlayer}
    <span class="badge badge-{queuedPlayer.ready ? 'info' : 'secondary'} mr-1">{queuedPlayer.name} ({queuedPlayer.cn})</span>
  {:else}
    nobody
  {/each}
</div>
