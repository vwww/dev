<script lang="ts">
import { type MemoEntry, type PathCount, remapPathCount } from '@gc/t3/ai'
import { winnerMapToNum, Winner, type WinnerMap } from '@gc/t3/game'
import type { GetMemoType } from './AppGameT3.svelte'

interface Props {
  boardHistory: number[]
  moveStack: number[]
  moveLength: number
  winner: Winner
  winnerMap: WinnerMap
  getMemo: GetMemoType | undefined
}

const {
  boardHistory,
  moveStack,
  moveLength,
  winner,
  winnerMap,
  getMemo
}: Props = $props()

let modalDetails: string | undefined = $state()

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
</script>

<table class="table table-striped table-bordered">
  <thead>
    <tr>
      <th>Move</th>
      <th>Paths</th>
      <th>Position</th>
      <th>X Win</th>
      <th>O Win</th>
      <th>Tie</th>
    </tr>
  </thead>
  <tbody>
    {#each { length: 9 }, i}
      {@const made = moveLength > i}
      {@const hasInfo = made || (moveLength === i && !winner)}
      {@const memo = hasInfo ? getMemo?.(boardHistory[i]) : undefined}
      {@const title = memo && memoTitle(memo, winnerMap)}

      <tr>
        <td>#{i + 1}</td>
        <td {title}>
          <!-- svelte-ignore a11y_invalid_attribute -->
          <a href="" data-bs-toggle="modal" data-bs-target="#detailsModal" onclick={() => modalDetails = title}>
            {memo?.[1][0].toLocaleString() ?? ''}
          </a>
        </td>
        <td class:table-warning={made}>{made ? moveStack[i] + 1 : ''}</td>
        {#each [Winner.P1, Winner.P2, Winner.Tie] as w}
          {@const [text, className, title] = memo ? winInfo(i, memo, winnerMap, w) : []}
          <td class={className} {title}>
            <!-- svelte-ignore a11y_invalid_attribute -->
            <a href="" data-bs-toggle="modal" data-bs-target="#detailsModal" onclick={() => modalDetails = title}>
              {text}
            </a>
          </td>
        {/each}
      </tr>
    {/each}
  </tbody>
</table>

<div class="modal fade" id="detailsModal" tabindex="-1" role="dialog" aria-labelledby="detailsModalTitle" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="detailsModalTitle">Details</h5>
        <button class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="d-flex">
          <pre>{modalDetails}</pre>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-danger" data-bs-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
