<script>
function formatNum (n) {
  return n.toLocaleString()
}

function formatTimes (times) {
  if (times === 1) return 'once'
  else if (times === 2) return 'twice'
  return formatNum(times) + 'x'
}

function formatScore (score) {
  return (score >= 0 ? '+' : '') + formatNum(score)
}

function formatResult (score, count, fmt, zero) {
  // TODO: move HTML-generating function to subcomponent
  if (!count) return (zero || 'N/A')

  if (!fmt) fmt = formatNum

  var result = fmt(score)
  if (count > 1) {
    score *= count
    result += ' each<br>' + fmt(score) + ' total'
  }
  return result
}

function formatResultClass (result) {
  if (!result) {
    return 'table-warning'
  } else if (result > 0) {
    return 'table-success'
  } else {
    return 'table-danger'
  }
}

let modeInverted = false
let modeCount = false

const names = ['Rock', 'Paper', 'Scissors']
let count = [1, 2, 3]
let ltw = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
let pairResults = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
let scores = [0, 0, 0]
let totalPlayers = 0
let totalWins = 0
let totalLoss = 0
let totalTies = 0
let totalRound = 0
$: totalResults = totalPlayers * (totalPlayers - 1)
$: totalBattles = totalResults / 2

$: {
  totalPlayers = 0
  totalWins = 0
  totalLoss = 0
  totalTies = 0
  totalRound = 0
  ltw = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]

  const battleResult = Array(3).fill().map((_, i) =>
    Array(3).fill().map((_, j) => {
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

  for (let i = 0; i < 3; ++i) {
    for (let j = 0; j < 3; ++j) {
      let resultHTML = 'N/A'
      let resultClass = ''

      let times = count[j]
      if (times && i === j) times--
      if (count[i] && times) {
        let result = battleResult[i][j]
        ltw[i][result + 1] += times
        if (!result) {
          resultHTML = 'Tie'
        } else if (result > 0) {
          resultHTML = 'Win'
        } else {
          resultHTML = 'Lose'
        }
        resultHTML += '<br>' + formatResult(times, count[i], formatTimes)
        resultClass = formatResultClass(result)
      }

      pairResults[i][j] = [resultHTML, resultClass]
    }

    totalPlayers += count[i]
    totalWins += ltw[i][2] * count[i]
    totalLoss += ltw[i][0] * count[i]
    totalTies += ltw[i][1] * count[i]
    totalRound += Math.sign(ltw[i][2] - ltw[i][0]) * count[i]
  }
}

const PRESETS = [
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

<div class="btn-group d-flex mb-2" role="group">
  <button on:click={() => modeInverted = !modeInverted} class="w-100 btn {modeInverted ? 'active btn' : 'btn-outline'}-success">Inverted</button>
  <button on:click={() => modeCount = !modeCount} class="w-100 btn {modeCount ? 'active btn' : 'btn-outline'}-warning">Count</button>
</div>

<div class="btn-group d-flex mb-3" role="group">
  <span class="input-group-text">Presets:</span>
  {#each PRESETS as p}
    <button
      on:click={() => { [count[0], count[1], count[2]] = p }}
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
      <tr>
        <td>{name}</td>
        <td><input type="number" min="0" max="94906266" bind:value={count[id]}></td>
        <td>{@html formatResult(ltw[id][2], count[id])}</td>
        <td>{@html formatResult(ltw[id][0], count[id])}</td>
        <td>{@html formatResult(ltw[id][1], count[id])}</td>
        <td class={count[id] ? formatResultClass(ltw[id][2] - ltw[id][0]) : ''}>{@html formatResult(ltw[id][2] - ltw[id][0], count[id], formatScore)}</td>
        <td class={count[id] ? formatResultClass(ltw[id][2] - ltw[id][0]) : ''}>{@html formatResult(Math.sign(ltw[id][2] - ltw[id][0]), count[id], formatScore)}</td>
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
      <td class={formatResultClass(totalWins - totalLoss)}>{formatScore(totalWins - totalLoss)}</td>
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
        {#each pairResults[i] as result}
          <td class={result[1]}>{@html result[0]}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
