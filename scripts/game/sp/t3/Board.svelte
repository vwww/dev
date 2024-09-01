<script lang="ts">
import Board from '@gc/t3/Board.svelte'
import { Player, Winner, type WinnerMap } from '@gc/t3/game'
import { type GetMemoType } from './AppGameT3.svelte'
import BoardCell from './BoardCell.svelte'

export let board: number
export let winner: Winner
export let winnerMap: WinnerMap
export let mark: Player
export let showHints: boolean
export let getMemo: GetMemoType | undefined
export let onMove: (move: number) => void
</script>

<Board let:i {winner}>
  <BoardCell {i} {board} {winner} {winnerMap} {mark} {showHints} {getMemo} onMove={() => onMove(i)} />
</Board>
