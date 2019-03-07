(function () {
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
      return 'warning'
    } else if (result > 0) {
      return 'success'
    } else {
      return 'danger'
    }
  }

  function update () {
    var count = [0, 0, 0]
    for (var i = 0; i < 3; ++i) {
      count[i] = +$id('p' + i).value
    }

    var result = [[0, -1, 1], [1, 0, -1], [-1, 1, 0]]

    var totalPlayers = 0
    var totalWins = 0
    var totalLoss = 0
    var totalTies = 0
    for (i = 0; i < 3; ++i) {
      var wins = 0
      var loss = 0
      var ties = 0

      for (var j = 0; j < 3; ++j) {
        var $elem = $id('m' + i + j)

        var resultHTML = 'N/A'
        var resultClass = ''

        var times = count[j]
        if (times && i === j) times--
        if (count[i] && times) {
          if (!result[i][j]) {
            ties += times
            resultHTML = 'Tie'
          } else if (result[i][j] > 0) {
            wins += times
            resultHTML = 'Win'
          } else {
            loss += times
            resultHTML = 'Lose'
          }
          resultHTML += '<br>' + formatResult(times, count[i], formatTimes)
          resultClass = formatResultClass(result[i][j])
        }

        $elem.innerHTML = resultHTML
        $elem.className = resultClass
      }

      $id('m' + i + 'w').innerHTML = formatResult(wins, count[i])
      $id('m' + i + 'l').innerHTML = formatResult(loss, count[i])
      $id('m' + i + 't').innerHTML = formatResult(ties, count[i])
      $id('m' + i + 's').innerHTML = formatResult(wins - loss, count[i], formatScore)
      $id('m' + i + 's').className = count[i] ? formatResultClass(wins - loss) : ''

      totalPlayers += count[i]
      totalWins += wins * count[i]
      totalLoss += loss * count[i]
      totalTies += ties * count[i]
    }

    $id('tw').innerHTML = formatNum(totalWins)
    $id('tl').innerHTML = formatNum(totalLoss)
    $id('tt').innerHTML = formatNum(totalTies)
    $id('ts').innerHTML = formatScore(totalWins - totalLoss)
    $id('ts').className = formatResultClass(totalWins - totalLoss)

    $id('tp').innerHTML = formatNum(totalPlayers)
    if (totalPlayers >= 1) {
      var totalResults = totalPlayers * (totalPlayers - 1)
      var totalBattles = totalResults / 2
      $id('tp').innerHTML += ' player(s)<br>' +
        formatNum(totalBattles) + ' battle(s)<br>' +
        formatNum(totalResults) + ' result(s)'
    }
  }

  $id('p0').addEventListener('change', update)
  $id('p1').addEventListener('change', update)
  $id('p2').addEventListener('change', update)
  document.addEventListener('DOMContentLoaded', update)

  function $id (x) { return document.getElementById(x) }
})()
