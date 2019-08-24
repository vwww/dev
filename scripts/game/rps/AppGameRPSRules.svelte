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

const names = ['Rock', 'Paper', 'Scissors']
let count = [1, 2, 3]
const battleResult = [[0, -1, 1], [1, 0, -1], [-1, 1, 0]]
let ltw = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
// let totalLTW = [0, 0, 0]
let pairResults = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
let scores = [0, 0, 0]
let totalPlayers = 0
let totalWins = 0
let totalLoss = 0
let totalTies = 0
$: totalResults = totalPlayers * (totalPlayers - 1)
$: totalBattles = totalResults / 2

$: {
  totalPlayers = 0
  totalWins = 0
  totalLoss = 0
  totalTies = 0
  ltw = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]

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
  }
}
</script>

<p>(options for inverted/count will be added in the future)</p>

<table class="table table-striped table-bordered table-hover">
  <thead>
    <tr>
      <th>Move</th>
      <th>Count</th>
      <th>Wins</th>
      <th>Losses</th>
      <th>Ties</th>
      <th>Score</th>
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
        {#each names as name2, j}
          <td class={pairResults[i][j][1]}>{@html pairResults[i][j][0]}</td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>
