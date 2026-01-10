<script lang="ts" generics="C extends CommonClient">
import type { CommonClient } from './game/CommonGame.svelte'

type Score = bigint | number | string | [number, number] | [bigint, bigint]

interface Props {
  leaderboard: ArrayLike<C>
  localClient: C
  columns?: [string, (client: C) => Score][]

  inGame: unknown
  onReset: () => void
}

const { leaderboard, localClient, columns = [], inGame, onReset }: Props = $props()

function formatScore(s: Score) {
  if (typeof s === 'object') {
    if (!s[1]) return s[0]
    const pct = typeof s[0] == 'bigint'
      ? Number(s[0] * 1000000n / (s[1] as bigint)) / 10000
      : s[0] * 100 / (s[1] as number)
    return `${s[0]} (${pct.toPrecision(3)}%)`
  }
  return s
}

let showSpect = $state(true)
</script>

<div class="card mb-3">
  <div class="card-header">
    <h4 class="float-start">Leaderboard</h4>
    <div class="float-end">
      <div class="input-group float-end">
        {#if inGame}
          <button class="btn btn-sm btn-warning" onclick={onReset}>Reset My Score</button>
        {/if}
        <span class="input-group-text">
          <label class="form-check mx-auto">
            <input type="checkbox" class="form-check-input" bind:checked={showSpect}>
            show spectators
          </label>
        </span>
      </div>
    </div>
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
        {#each leaderboard as c}
          {@const isMe = c === localClient}
          {@const {active} = c}
          {#if showSpect || isMe || active}
            <tr
              class:table-info={isMe && active}
              class:table-warning={isMe && !active}
              class:table-secondary={!isMe && !active}>
              <th scope="row">{c.name} ({c.cn})</th>
              <td>{c.rank}</td>
              {#each columns as column}
                <td>{formatScore(column[1](c))}</td>
              {/each}
              <td>{c.ping < 0 ? '?' : c.ping}</td>
            </tr>
          {/if}
        {:else}
          <tr class="table-secondary"><td class="text-center" colspan={3 + columns.length}>nobody</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
