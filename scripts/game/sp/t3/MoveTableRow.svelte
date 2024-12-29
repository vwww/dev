<script lang="ts">
import { type MemoEntry, type PathCount, remapPathCount } from '@gc/t3/ai'
import { winnerMapToNum, Winner, type WinnerMap } from '@gc/t3/game'
import { type GetMemoType } from './AppGameT3.svelte'

interface Props {
  i: number
  boardHistory: number[]
  moveStack: number[]
  moveLength: number
  winner: Winner
  winnerMap: WinnerMap
  getMemo?: GetMemoType
}

const {
  i,
  boardHistory,
  moveStack,
  moveLength,
  winner,
  winnerMap,
  getMemo
}: Props = $props()

function memoTitle (memo: MemoEntry, winnerMap: WinnerMap): string {
  const countPathsRaw = memo[1]
  const countPaths = remapPathCount(countPathsRaw, winnerMap)

  return `Path Count:\n\n${formatPathCount(countPaths)}\n\nUnmapped\n${formatPathCount(countPathsRaw)}`

  function formatPathCount (p: PathCount) {
    return `X Win: ${p[1].toLocaleString()}`
      + `\nO Win: ${p[2].toLocaleString()}`
      + `\nTie: ${p[3].toLocaleString()}`
      + `\nTotal: ${p[0].toLocaleString()}`
  }
}

type Entry = [text: string, className?: string, title?: string]

function winInfo (i: number, memo: MemoEntry, winnerMap: WinnerMap, result: Winner): Entry {
  const [memoEntry, countPathsRaw] = memo
  const countPaths = remapPathCount(countPathsRaw, winnerMap)
  const countPath = countPaths[result]

  const otherPossible = (result !== 1 && countPaths[1]) || (result !== 2 && countPaths[2]) || (result !== 3 && countPaths[3])
  const entry = memoEntry[winnerMapToNum(winnerMap.map((w) => ((i ^ (w === result ? 0 : 1)) & 1) + 1) as WinnerMap)]

  const val = entry[0]
  const canForce = val > 0 ? (10 - val) : 0

  const text =
    canForce ? `${otherPossible ? 'Forcable' : 'Result'} (${canForce === i + 1 ? 'now' : 'by #' + canForce})`
      : countPath ? 'Possible' : 'Impossible'

  const className = `table-${canForce ? 'info' : countPath ? 'success' : 'danger'}`

  const countPathForced = entry[2] ?? 0
  const countPathForcedNoTiming = entry[3] ?? 0
  const pathForcedType = val > 0 ? 'Forced' : 'Lost'

  let title = `Path Count: ${countPath.toLocaleString()}`
    + `\n\n${pathForcedType}:`
    + `\n${countPathForced.toLocaleString()}`
    + `\n${countPathForcedNoTiming.toLocaleString()} (without timing)`

  return [text, className, title]
}

const emptyEntry: Entry = ['']
const emptyInfo = [emptyEntry, emptyEntry, emptyEntry]

const made = $derived(moveLength > i)
const hasInfo = $derived(made || (moveLength === i && !winner))
const memo = $derived(hasInfo ? getMemo?.(boardHistory[i]) : undefined)

const info = $derived(!memo ? emptyInfo
  : [
    winInfo(i, memo, winnerMap, Winner.P1),
    winInfo(i, memo, winnerMap, Winner.P2),
    winInfo(i, memo, winnerMap, Winner.Tie)
  ])
</script>

<tr>
  <td>#{i + 1}</td>
  <td title={memo && memoTitle(memo, winnerMap)}>{memo?.[1][0].toLocaleString() ?? ''}</td>
  <td class:table-warning={made}>{made ? moveStack[i] + 1 : ''}</td>
  {#each info as c}
    <td class={c[1]} title={c[2]}>{c[0]}</td>
  {/each}
</tr>
