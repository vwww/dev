<script>
export let i
export let boardHistory
export let moveStack
export let moveLength
export let winner
export let winnerMap
export let getMemo

import { winnerMapToNum, winnerMapInvert } from '../../common/t3/game'

function setWin (canDo, onlyPossible, canForce = 0) {
  canForce = canForce > 0 ? (10 - canForce) : 0
  const text =
    canForce ? (onlyPossible ? 'Result' : 'Forcable') + ' (' + (canForce === i + 1 ? 'now' : 'by #' + canForce) + ')'
      : canDo ? 'Possible' : 'Impossible'
  const className = 'table-' + (canForce ? 'info' : canDo ? 'success' : 'danger')
  return [text, className]
}

const emptyEntry = ['', '']
const emptyInfo = [emptyEntry, emptyEntry, emptyEntry]

$: made = moveLength > i
$: hasInfo = made || (moveLength === i && !winner)
$: entry = hasInfo && getMemo ? getMemo(boardHistory[i]) : undefined
$: gameType = winnerMapToNum(winnerMap)
$: gameTypeInv = winnerMapToNum(winnerMapInvert(winnerMap))
$: gameTypeTie = winnerMapToNum(winnerMap.map(w => w === 3 ? (i & 1) + 1 : 3))
$: info = !entry ? emptyInfo
  : [
    setWin(entry[gameType][1] & 1, entry[gameType][1] === 1, entry[(i & 1) ? gameTypeInv : gameType][0]),
    setWin(entry[gameType][1] & 2, entry[gameType][1] === 2, entry[(i & 1) ? gameType : gameTypeInv][0]),
    setWin(entry[gameType][1] & 4, entry[gameType][1] === 4, (entry[gameType][1] & 4) && entry[gameTypeTie][0])
  ]
</script>

<tr>
  <td>#{i + 1}</td>
  <td class:table-warning={made}>{made ? moveStack[i] + 1 : ''}</td>
  {#each info as c}
    <td class={c[1]}>{c[0]}</td>
  {/each}
</tr>
