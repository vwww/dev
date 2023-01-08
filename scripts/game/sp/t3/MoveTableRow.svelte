<script lang="ts">
import { MemoEntry, PathCount } from '@gc/t3/ai'
import { winnerMapToNum, Winner, WinnerMap } from '@gc/t3/game'
import { GetMemoType } from './AppGameT3.svelte'

export let i: number
export let boardHistory: number[]
export let moveStack: number[]
export let moveLength: number
export let winner: Winner
export let winnerMap: WinnerMap
export let getMemo: GetMemoType | undefined

function remapPathCount (p: PathCount, winnerMap: WinnerMap): PathCount {
  const result: PathCount = [p[0], 0, 0, 0]
  for (let w = 1; w <= 3; w++) {
    result[winnerMap[w - 1]] += p[w]
  }
  return result
}

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

function winInfo (memo: MemoEntry, result: number, winnerMap2: WinnerMap): Entry {
  const [memoEntry, countPathsRaw] = memo
  const countPaths = remapPathCount(countPathsRaw, winnerMap)
  const countPathPossible = countPaths[result]

  const canDo = countPathPossible
  const onlyPossible = canDo && !((result !== 1 && countPaths[1]) || (result !== 2 && countPaths[2]) || (result !== 3 && countPaths[3]))
  const entry = memoEntry[winnerMapToNum(winnerMap2)]

  const val = entry[0]
  const canForce = val > 0 ? (10 - val) : 0

  const text =
    canForce ? `${onlyPossible ? 'Result' : 'Forcable'} (${canForce === i + 1 ? 'now' : 'by #' + canForce})`
      : canDo ? val < 0 ? 'Preventable' : 'Possible' : 'Impossible'

  const className = `table-${canForce ? 'info' : canDo ? 'success' : 'danger'}`

  let title: string | undefined
  if (countPathPossible) {
    title = `Path Count\n\nAll: ${countPathPossible.toLocaleString()}`

    const countPathForced = entry[2]
    if (countPathForced) {
      const countPathUntaken = entry[3] ?? 0
      title += `\n\n${val > 0 ? 'Forced' : val < 0 ? 'Lost' : 'Neutral'}: ${countPathForced.toLocaleString()}` +
        `\nUntaken: ${countPathUntaken.toLocaleString()}` +
        `\nTotal: ${(countPathForced + countPathUntaken).toLocaleString()}`
    }
  }

  return [text, className, title]
}

const emptyEntry: Entry = ['']
const emptyInfo = [emptyEntry, emptyEntry, emptyEntry]

$: made = moveLength > i
$: hasInfo = made || (moveLength === i && !winner)
$: memo = hasInfo && getMemo ? getMemo(boardHistory[i]) : undefined

$: winnerMapX = winnerMap.map(w => ((i ^ (w === Winner.P1 ? 0 : 1)) & 1) + 1) as WinnerMap
$: winnerMapO = winnerMap.map(w => ((i ^ (w === Winner.P2 ? 0 : 1)) & 1) + 1) as WinnerMap
$: winnerMapTie = winnerMap.map(w => ((i ^ (w === Winner.Tie ? 0 : 1)) & 1) + 1) as WinnerMap
$: info = !memo ? emptyInfo
  : [
    winInfo(memo, 1, winnerMapX),
    winInfo(memo, 2, winnerMapO),
    winInfo(memo, 3, winnerMapTie)
  ]
</script>

<tr>
  <td>#{i + 1}</td>
  <td title={memo && memoTitle(memo, winnerMap)}>{memo?.[1][0].toLocaleString() ?? ''}</td>
  <td class:table-warning={made}>{made ? moveStack[i] + 1 : ''}</td>
  {#each info as c}
    <td class={c[1]} title={c[2]}>{c[0]}</td>
  {/each}
</tr>
