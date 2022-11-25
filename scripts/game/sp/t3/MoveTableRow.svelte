<script lang="ts">
import { MemoEntry } from '@gc/t3/ai'
import { winnerMapToNum, winnerMapInvert, Winner, WinnerMap } from '@gc/t3/game'
import { GetMemoType } from './AppGameT3.svelte'

export let i: number
export let boardHistory: number[]
export let moveStack: number[]
export let moveLength: number
export let winner: Winner
export let winnerMap: WinnerMap
export let getMemo: GetMemoType | undefined

type Entry = [text: string, className?: string, title?: string]

function winInfo (memo: MemoEntry, result: number, gameType: number): Entry {
  const canDo = memo[1][result]
  const onlyPossible = canDo && !((result !== 1 && memo[1][1]) || (result !== 2 && memo[1][2]) || (result !== 3 && memo[1][3]))
  const entry = memo[0][gameType]

  const val = entry[0]
  const canForce = val > 0 ? (10 - val) : 0
  const countPathForced = entry[2]
  const countPathPossible = canDo // memo[1][result]

  const text =
    canForce ? `${onlyPossible ? 'Result' : 'Forcable'} (${canForce === i + 1 ? 'now' : 'by #' + canForce})`
      : canDo ? val < 0 ? 'Preventable' : 'Possible' : 'Impossible'
  const className = `table-${canForce ? 'info' : canDo ? val < 0 ? 'warning' : 'success' : 'danger'}`
  let title: string | undefined
  if (countPathPossible) {
    title = `Path Count\n\nPossible: ${countPathPossible}`
    if (countPathForced) {
      title += `\n${val > 0 ? 'Forcable' : val < 0 ? 'Lost' : 'Neutral'}: ${countPathForced}`
    }
  }

  return [text, className, title]
}

const emptyEntry: Entry = ['']
const emptyInfo = [emptyEntry, emptyEntry, emptyEntry]

$: made = moveLength > i
$: hasInfo = made || (moveLength === i && !winner)
$: memo = hasInfo && getMemo ? getMemo(boardHistory[i]) : undefined
$: gameType = winnerMapToNum(winnerMap)
$: gameTypeInv = winnerMapToNum(winnerMapInvert(winnerMap))
$: gameTypeTie = winnerMapToNum(winnerMap.map(w => w === 3 ? (i & 1) + 1 : 3) as WinnerMap)
$: info = !memo ? emptyInfo
  : [
    winInfo(memo, 1, (i & 1) ? gameTypeInv : gameType),
    winInfo(memo, 2, (i & 1) ? gameType : gameTypeInv),
    winInfo(memo, 3, gameTypeTie)
  ]
</script>

<tr>
  <td>#{i + 1}</td>
  <td class:table-warning={made}>{made ? moveStack[i] + 1 : ''}</td>
  {#each info as c}
    <td class={c[1]} title={c[2]}>{c[0]}</td>
  {/each}
</tr>
