<script lang="ts">
import { remapPathCount } from '@gc/t3/ai'
import { Player, Winner, type WinnerMap, winnerMapToNum } from '@gc/t3/game'

import BoardCell from '@gc/t3/BoardCell.svelte'

import { type GetMemoType } from './AppGameT3.svelte'

interface Props {
  i: number
  board: number
  winner: Winner
  winnerMap: WinnerMap
  mark: Player
  showHints: boolean
  getMemo: GetMemoType | undefined
  onMove: () => void
}

const {
  i,
  board,
  winner,
  winnerMap,
  mark,
  showHints,
  getMemo,
  onMove,
}: Props = $props()

const boardValue = $derived((board >> (i << 1)) & 3)

const memoEntry = $derived(!boardValue && showHints && !winner && getMemo?.(board | (mark << (i << 1))))

const [hintClass, hintVal] = $derived.by(function () {
  if (!memoEntry) return []

  const [typeDep, countPathsRaw] = memoEntry
  const val = typeDep[winnerMapToNum(winnerMap)][0]
  const countPaths = remapPathCount(countPathsRaw, winnerMap)

  const noTie = !countPaths[3]
  const noLose = !countPaths[3 ^ mark]
  const noWin = !countPaths[mark]
  const scoreType = !val ? 'tie' : val < 0 ? 'win' : 'lose'

  return [`h${scoreType}${noWin ? ' noW' : ''}${noTie ? ' noT' : ''}${noLose ? ' noL': ''}`, val]
})
</script>

<BoardCell {winner} mark={boardValue} markHover={mark} {hintClass} {hintVal} {onMove} />
