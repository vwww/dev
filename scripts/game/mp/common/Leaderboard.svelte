<script lang="ts">
import type { BaseClient } from './game/CommonGame'

type P = $$Generic<BaseClient>

export let players: ArrayLike<P>
export let columns: [string, (p: P) => number | string][] = []

let showSpect = true
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Leaderboard</h4>
    <label class="form-check float-end">
      <input type="checkbox" class="form-check-input" bind:checked={showSpect}>
      <span class="form-check-label">show spectators</span>
    </label>
  </div>
  <div class="table-responsive" style="max-height: 20rem">
    <table class="table table-sm">
      <tr>
        <th scope="col">Name</th>
        <th scope="col">Rank</th>
        {#each columns as column}
          <th scope="col">{column[0]}</th>
        {/each}
        <th scope="col">Ping</th>
      </tr>
      {#each players as player}
        {#if showSpect || player.isMe || player.active}
          <tr
            class:table-info={player.isMe && player.active}
            class:table-warning={player.isMe && !player.active}
            class:table-secondary={!player.isMe && !player.active}>
            <th scope="row" colspan={player.active ? 1 : 2}>{player.name} ({player.cn})</th>
            {#if player.active}
              <td>{player.rank}</td>
            {/if}
            {#each columns as column}
              <td>{column[1](player)}</td>
            {/each}
            <td>{player.ping < 0 ? '?' : player.ping}</td>
          </tr>
        {/if}
      {:else}
        <tr class="table-secondary"><td colspan={3 + columns.length}>nobody</td></tr>
      {/each}
    </table>
  </div>
</div>
