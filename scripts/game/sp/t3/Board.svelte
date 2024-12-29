<script lang="ts">
import Board from '@gc/t3/Board.svelte'
import { Player, Winner, type WinnerMap } from '@gc/t3/game'
import { type GetMemoType } from './AppGameT3.svelte'
import BoardCell from './BoardCell.svelte'

interface Props {
  board: number
  winner: Winner
  winnerMap: WinnerMap
  mark: Player
  showHints: boolean
  getMemo: GetMemoType | undefined
  onMove: (move: number) => void
}

const {
  board,
  winner,
  winnerMap,
  mark,
  showHints,
  getMemo,
  onMove,
}: Props = $props()
</script>

<Board  {winner}>
  {#snippet children({ i })}
    <BoardCell {i} {board} {winner} {winnerMap} {mark} {showHints} {getMemo} onMove={() => onMove(i)} />
  {/snippet}
</Board>
