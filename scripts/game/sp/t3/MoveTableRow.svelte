<script lang="ts">
import { winnerMapToNum, winnerMapInvert, Winner, WinnerMap } from '../../common/t3/game'
import { GetMemoType } from './AppGameT3.svelte'

export let i: number
export let boardHistory: number[]
export let moveStack: number[]
export let moveLength: number
export let winner: Winner
export let winnerMap: WinnerMap
export let getMemo: GetMemoType | undefined

function setWin (canDo: number | boolean, onlyPossible: boolean, canForce = 0): [string, string] {
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
$: gameTypeTie = winnerMapToNum(winnerMap.map(w => w === 3 ? (i & 1) + 1 : 3) as WinnerMap)
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
