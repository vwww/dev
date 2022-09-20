<script lang="ts">
export let inGame = false
export let isActive = false
export let canReady = false
export let isReady = false
export let onReset: () => void
export let onDisconnect: () => void
export let onSetActive: (active: boolean) => void
export let onSetReady: (ready: boolean) => void
</script>

<div class:d-none={inGame} class="alert alert-danger" role="alert">
  <h4 class="alert-heading">Disconnected</h4>
  Join or create a room above!
</div>

<div class:d-none={!inGame || isActive} class="alert alert-warning" role="alert">
  <h4 class="alert-heading">Spectating</h4>
  <span class="badge bg-primary">Unspectate</span> if you want to play!
</div>

<div class:d-none={!inGame || !isActive || !canReady || isReady} class="alert alert-info" role="alert">
  <h4 class="alert-heading">Unready</h4>
  If all players are <span class="badge bg-info">Ready</span>, the intermission ends early.
</div>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Play</h4>
    {#if inGame}
      <div class="float-end">
        {#if isActive}
          {#if canReady}
            {#if isReady}
              <button class="btn btn-sm btn-success" on:click={() => onSetReady(false)}>Unready</button>
            {:else}
              <button class="btn btn-sm btn-info" on:click={() => onSetReady(true)}>Ready</button>
              {/if}
          {/if}
          <button class="btn btn-sm btn-secondary" on:click={() => onSetActive(false)}>Spectate</button>
        {:else}
          <button class="btn btn-sm btn-primary" on:click={() => onSetActive(true)}>Unspectate</button>
        {/if}
        <div class="btn-group">
          <button class="btn btn-sm btn-warning" on:click={onReset}>Reset Score</button>
          <button class="btn btn-sm btn-danger" on:click={onDisconnect}>Disconnect</button>
        </div>
      </div>
    {/if}
  </div>
  <div class="card-body">
    <slot />
  </div>
</div>
