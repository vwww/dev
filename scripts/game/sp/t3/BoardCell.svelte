<script lang="ts">
import BoardCell from '../../common/t3/BoardCell.svelte'
import { Player, Winner, WinnerMap, winnerMapToNum } from '../../common/t3/game'
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

  const entry = getMemo(board | (mark << (i << 1)))?.[winnerMapToNum(winnerMap)]
  if (!entry) return

  const noTie = !(entry[1] & 4)
  const noLose = !(entry[1] & (3 ^ mark))
  const noWin = !(entry[1] & mark)
  const scoreType = !entry[0] ? 'tie' : entry[0] < 0 ? 'win' : 'lose'

  return [`h${scoreType}${noWin ? ' noW' : ''}${noTie ? ' noT' : ''}${noLose ? ' noL': ''}`, entry[0]]
}

function recalcWhenNeeded (..._: any[]) {
  return recalc()
}

$: [hintClass, hintVal] = recalcWhenNeeded(board, showHints, winnerMap, getMemo) || ['']
</script>

<BoardCell {winner} mark={boardValue} markHover={mark} {hintClass} {hintVal} {onMove} />
