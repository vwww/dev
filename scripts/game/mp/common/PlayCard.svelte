<script lang="ts">
import type { Snippet } from 'svelte'

interface Props {
  inGame?: boolean
  isActive?: boolean
  canReady?: boolean
  isReady?: boolean
  onReset: () => void
  onDisconnect: () => void
  onSetActive: (active: boolean) => void
  onSetReady: (ready: boolean) => void
  children?: Snippet
}

const {
  inGame = false,
  isActive = false,
  canReady = false,
  isReady = false,
  onReset,
  onDisconnect,
  onSetActive,
  onSetReady,
  children,
}: Props = $props()
</script>

<div class:d-none={inGame} class="alert alert-danger" role="alert">
  <h4 class="alert-heading">Disconnected</h4>
  Join or create a room above!
</div>

<div class:d-none={!inGame || isActive} class="alert alert-warning" role="alert">
  <h4 class="alert-heading">Spectating</h4>
  <span class="badge text-bg-primary">Unspectate</span> if you want to play!
</div>

<div class:d-none={!inGame || !isActive || !canReady || isReady} class="alert alert-info" role="alert">
  <h4 class="alert-heading">Unready</h4>
  If all players are <span class="badge text-bg-info">Ready</span>, the intermission ends early.
</div>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Play</h4>
    {#if inGame}
      <div class="float-end">
        {#if isActive}
          {#if canReady}
            {#if isReady}
              <button class="btn btn-sm btn-success" onclick={() => onSetReady(false)}>Unready</button>
            {:else}
              <button class="btn btn-sm btn-info" onclick={() => onSetReady(true)}>Ready</button>
              {/if}
          {/if}
          <button class="btn btn-sm btn-secondary" onclick={() => onSetActive(false)}>Spectate</button>
        {:else}
          <button class="btn btn-sm btn-primary" onclick={() => onSetActive(true)}>Unspectate</button>
        {/if}
        <div class="btn-group">
          <button class="btn btn-sm btn-warning" onclick={onReset}>Reset Score</button>
          <button class="btn btn-sm btn-danger" onclick={onDisconnect}>Disconnect</button>
        </div>
      </div>
    {/if}
  </div>
  <div class="card-body">
    {@render children?.()}
  </div>
</div>
