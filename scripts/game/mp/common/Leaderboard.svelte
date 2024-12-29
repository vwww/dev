<script lang="ts" generics="P extends BaseClient">
import type { BaseClient } from './game/CommonGame'

type Score = number | string | [number, number]

interface Props {
  players: ArrayLike<P>
  columns?: [string, (p: P) => Score][]
}

const { players, columns = [] }: Props = $props()

function formatScore(s: Score) {
  if (typeof s === 'object') {
    if (!s[1]) return s[0]
    return `${s[0]} (${(s[0] * 100 / s[1]).toPrecision(3)}%)`
  }
  return s
}

let showSpect = $state(true)
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
      <tbody>
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
                <td>{formatScore(column[1](player))}</td>
              {/each}
              <td>{player.ping < 0 ? '?' : player.ping}</td>
            </tr>
          {/if}
        {:else}
          <tr class="table-secondary"><td colspan={3 + columns.length}>nobody</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
