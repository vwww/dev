<script>
import BoardCell from '../../common/t3/BoardCell'
import { winnerMapToNum } from '../../common/t3/game'

export let i
export let board
export let winner
export let winnerMap
export let mark
export let showHints
export let getMemo
export let onMove

$: boardValue = (board >> (i << 1)) & 3

function recalc () {
  if (boardValue || !showHints || winner || !getMemo) return

  const entry = getMemo(board | (mark << (i << 1)))[winnerMapToNum(winnerMap)]
  if (!entry) return

  const noTie = !(entry[1] & 4)
  const noLose = !(entry[1] & (3 ^ mark))
  const noWin = !(entry[1] & mark)
  const scoreType = !entry[0] ? 'tie' : entry[0] < 0 ? 'win' : 'lose'

  return [`h${scoreType}${noWin ? ' noW' : ''}${noTie ? ' noT' : ''}${noLose ? ' noL': ''}`, entry[0]]
}
$: [hintClass, hintVal] = recalc(board, showHints, winnerMap, getMemo) || ['']
</script>

<BoardCell {winner} mark={boardValue} markHover={mark} {hintClass} {hintVal} {onMove} />
