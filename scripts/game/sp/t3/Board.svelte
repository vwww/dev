<script>
import Board from '../../common/t3/Board'
import BoardCell from './BoardCell'

export let board
export let winner
export let winnerMap
export let mark
export let showHints
export let getMemo
export let onMove

const cellNumbers = [[0, 1, 2], [3, 4, 5], [6, 7, 8]]
</script>

<Board let:i>
  <BoardCell {i} {board} {winner} {winnerMap} {mark} {showHints} {getMemo} onMove={() => onMove(i)} />
</Board>
