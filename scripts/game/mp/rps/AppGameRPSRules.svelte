<script lang="ts">
function formatNum (n: number): string {
  return n.toLocaleString()
}

function formatTimes (times: number): string {
  if (times === 1) return 'once'
  else if (times === 2) return 'twice'
  return formatNum(times) + 'x'
}

function formatScore (score: number): string {
  return (score >= 0 ? '+' : '') + formatNum(score)
}

function formatResultClass (result: number): string {
  if (!result) {
    return 'table-warning'
  } else if (result > 0) {
    return 'table-success'
  } else {
    return 'table-danger'
  }
}

let modeInverted = $state(false)
let modeCount = $state(false)

const names = ['Rock', 'Paper', 'Scissors']
let count = $state([1, 2, 3])
const battleResult = $derived(
  [0, 1, 2].map((i) =>
    [0, 1, 2].map((j) => {
      if (i === j) return 0
      const defaultWin = ((i + 1) % 3 === j) === modeInverted
      if (modeCount) {
        const a = count[defaultWin ? i : j]
        const b = count[defaultWin ? j : i]
        if (a < b) {
          return a * 2 <= b ? defaultWin ? -1 : 1 : 0
        }
      }
      return defaultWin ? 1 : -1
    })
  )
)
const [totalPlayers, totalWins, totalLoss, totalTies, totalBattle, totalRound, ltw] = $derived.by(() => {
  let totalPlayers = 0
  let totalWins = 0
  let totalLoss = 0
  let totalTies = 0
  let totalRound = 0
  const ltw = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]

  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      const times = count[j] - (i === j ? 1 : 0)
      if (count[i] && times) {
        const result = battleResult[i][j]
        ltw[i][result + 1] += times
      }
    }
    totalPlayers += count[i]
    totalWins += ltw[i][2] * count[i]
    totalLoss += ltw[i][0] * count[i]
    totalTies += ltw[i][1] * count[i]
    totalRound += Math.sign(ltw[i][2] - ltw[i][0]) * count[i]
  }

  return [totalPlayers, totalWins, totalLoss, totalTies, totalWins - totalLoss, totalRound, ltw]
})
const totalResults = $derived(totalPlayers * (totalPlayers - 1))
const totalBattles = $derived(totalResults / 2)

type number3 = [r: number, p: number, s: number]
type Preset = [...n: number3, desc: string]

const PRESETS: Preset[] = [
  [1, 2, 3, '3v2v1'],
  [1, 1, 0, '1v1'],
  [2, 0, 0, '2 same'],
  [2, 1, 0, '1v2'],
  [2, 2, 0, '2v2'],
  [1, 2, 0, '2v1'],
  [1, 1, 1, '1 each'],
  [2, 1, 1, '1 each + 1'],
]
</script>

{#snippet formatResult(score: number, count: number, fmt: (n: number) => string = formatNum, zero: string = 'N/A')}
{#if count}
  {fmt(score)}
  {#if count > 1}
    each<br>{fmt(score * count)} total
  {/if}
{:else}
  {zero}
{/if}
{/snippet}

<div class="btn-group d-flex mb-2" role="group">
  <button onclick={() => modeInverted = !modeInverted} class="w-100 btn {modeInverted ? 'active btn' : 'btn-outline'}-success">Inverted</button>
  <button onclick={() => modeCount = !modeCount} class="w-100 btn {modeCount ? 'active btn' : 'btn-outline'}-warning">Count</button>
</div>

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Presets:</span>
  {#each PRESETS as p}
    <button
      onclick={() => { [count[0], count[1], count[2]] = p }}
      class:active={count[0] === p[0] && count[1] === p[1] && count[2] === p[2]}
      class="w-100 btn btn-outline-secondary">{p[3]}</button>
  {/each}
</div>

<table class="table table-striped table-bordered table-hover">
  <thead>
    <tr>
      <th>Move</th>
      <th>Count</th>
      <th>Wins</th>
      <th>Losses</th>
      <th>Ties</th>
      <th>Battle Score</th>
      <th>Round Score</th>
    </tr>
  </thead>
  <tbody>
    {#each names as name, id}
      {@const [loss, tie, win] = ltw[id]}
      {@const delta = win - loss}
      <tr>
        <td>{name}</td>
        <td><input type="number" min="0" max="94906266" bind:value={count[id]}></td>
        <td>{@render formatResult(win, count[id])}</td>
        <td>{@render formatResult(loss, count[id])}</td>
        <td>{@render formatResult(tie, count[id])}</td>
        <td class={count[id] ? formatResultClass(delta) : ''}>{@render formatResult(delta, count[id], formatScore)}</td>
        <td class={count[id] ? formatResultClass(delta) : ''}>{@render formatResult(Math.sign(delta), count[id], formatScore)}</td>
      </tr>
    {/each}
    <tr>
      <td>Total</td>
      <td>
        {formatNum(totalPlayers)}
        {#if totalPlayers >= 1}
          player(s)<br>
          {formatNum(totalBattles)} battle(s)<br>
          {formatNum(totalResults)} result(s)
        {/if}
      </td>
      <td>{formatNum(totalWins)}</td>
      <td>{formatNum(totalLoss)}</td>
      <td>{formatNum(totalTies)}</td>
      <td class={formatResultClass(totalBattle)}>{formatScore(totalBattle)}</td>
      <td class={formatResultClass(totalRound)}>{formatScore(totalRound)}</td>
    </tr>
  </tbody>
</table>

<table class="table table-striped table-bordered table-hover">
  <thead>
    <tr>
      <th>Move</th>
      <th>vs. Rock</th>
      <th>vs. Paper</th>
      <th>vs. Scissors</th>
    </tr>
  </thead>
  <tbody>
    {#each names as name, i}
      <tr>
        <td>{name}</td>
        {#each names, j}
          {@const times = count[j] - (i === j ? 1 : 0)}
          {#if count[i] && times}
            {@const result = battleResult[i][j]}
            <td class={formatResultClass(result)}>
              {['Lose', 'Tie', 'Win'][result + 1]}
              <br>
              {@render formatResult(times, count[i], formatTimes)}
            </td>
          {:else}
            <td>N/A</td>
          {/if}
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
