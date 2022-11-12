<script lang="ts">
import BoardCell from '@gc/t3/BoardCell.svelte'
import { Player, Winner, WinnerMap, winnerMapToNum } from '@gc/t3/game'
import { GetMemoType } from './AppGameT3.svelte'

export let i: number
export let board: number
export let winner: Winner
export let winnerMap: WinnerMap
export let mark: Player
export let showHints: boolean
export let getMemo: GetMemoType | undefined
export let onMove: () => void

$: boardValue = (board >> (i << 1)) & 3

function recalc () : [string, number] | undefined {
  if (boardValue || !showHints || winner || !getMemo) return

  const memoEntry = getMemo(board | (mark << (i << 1)))
  if (!memoEntry) return

  const [typeDep, countTypes] = memoEntry
  const val = typeDep[winnerMapToNum(winnerMap)][0]

  const noTie = !(countTypes[3])
  const noLose = !(countTypes[3 ^ mark])
  const noWin = !(countTypes[mark])
  const scoreType = !val ? 'tie' : val < 0 ? 'win' : 'lose'

  return [`h${scoreType}${noWin ? ' noW' : ''}${noTie ? ' noT' : ''}${noLose ? ' noL': ''}`, val]
}

function recalcWhenNeeded (..._: any[]) {
  return recalc()
}

$: [hintClass, hintVal] = recalcWhenNeeded(board, showHints, winnerMap, getMemo) || ['']
</script>

<BoardCell {winner} mark={boardValue} markHover={mark} {hintClass} {hintVal} {onMove} />
