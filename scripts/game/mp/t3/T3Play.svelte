<script lang="ts">
import Board from '@gc/t3/Board.svelte'
import BoardCell from '@gc/t3/BoardCell.svelte'

import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import TwoPlayerEarlyEnd from '@gmc/TwoPlayerEarlyEnd.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { T3Game } from './T3Game.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: T3Game
  t3Isomorphism: number
}

const { gameState, t3Isomorphism }: Props = $props()

const {
  localClient,
  roundState,
  playing,
  canMove,
  myPlayer,
  drawOffer,
  boardState,
  boardBad,
  winner,
  moveHistory,
} = $derived(gameState)

const isomorphism1 = [[1, 5], [2, 0], [3, 7], [4, 6], [5, 4], [6, 2], [7, 1], [8, 8], [9, 3]] as const
const isomorphism2 = [
  ['air', 3], ['bee', 1], ['bits', 4],
  ['book', 7], ['eat', 0], ['less', 2],
  ['lip', 5], ['lot', 8], ['soda', 6]
] as const

function formatButtonClass (i: number, boardState: number, boardBad: number, canMove: boolean): string {
  const mark = (boardState >> (i << 1)) & 3
  const bad = (boardBad >> i) & 1
  return `${mark ? '' : 'outline-'}${['secondary', 'success', 'primary', 'danger'][mark || (bad ? 3 : 0)]}${mark || bad || !canMove ? ' disabled' : ''}`
}
</script>

<div class="mb-2">
  {#if roundState === GameState.WAITING}
    Waiting for players&hellip;
  {:else}
    {#if roundState === GameState.INTERMISSION}
      Intermission:
    {:else if canMove}
      Make a move:
    {:else if localClient.inRound}
      Waiting for opponent to move&hellip;
    {:else}
      Spectating:
    {/if}
    <ProgressBar
      startTime={gameState.roundTimerStart}
      endTime={gameState.roundTimerEnd}
      active={gameState.room} />
  {/if}
</div>

{#if !t3Isomorphism}
  <p>
    You are
    {#if !myPlayer}
      <span class="badge text-bg-secondary">spectating</span>.
    {:else if myPlayer === 1}
      <span class="badge text-bg-success">player X</span>.
    {:else}
      <span class="badge text-bg-danger">player O</span>.
    {/if}
    Get 3 in a row to win.
  </p>
  <Board {winner}>
    {#snippet cell(i)}
      <BoardCell
        {winner}
        mark={(boardState >> (i << 1)) & 3}
        markHover={canMove && !((boardBad >> i) & 1) ? myPlayer : 0}
        hintClass={((boardState >> (i << 1)) & 3) || !((boardBad >> i) & 1) ? '' : 'hlose'}
        onMove={() => gameState.sendMove(i)} />
    {/snippet}
  </Board>

  <div>
    Moves:
    {#each moveHistory as move, i}
      <span class="badge text-bg{myPlayer == (i & 1) + 1 ? '' : '-outline'}-{(i & 1) ? 'danger' : 'success'} me-1">{move}</span>
    {:else}
      (none)
    {/each}
  </div>
{:else}
  <p>
    You are
    {#if !myPlayer}
      <span class="badge text-bg-secondary">spectating</span>.
    {:else if myPlayer === 1}
      <span class="badge text-bg-success">player X</span>.
    {:else}
      <span class="badge text-bg-primary">player O</span>.
    {/if}
    Take 3 {['numbers that sum to 15', 'words that have the same letter'][t3Isomorphism - 1]}.
  </p>
  <div class="m-auto text-center">
    <div class="btn-group">
      {#each (t3Isomorphism === 1 ? isomorphism1 : isomorphism2) as [displayText, i]}
        <button
          class="btn btn-{formatButtonClass(i, boardState, boardBad, canMove)}"
          onclick={() => gameState.sendMove(i)}
        >{displayText}</button>
      {/each}
    </div>
  </div>
{/if}

{#if playing}
  {#if canMove}
    <button
      class="btn btn-outline-secondary d-block w-100 my-2"
      onclick={() => gameState.sendMoveEnd()}>End Turn (Auto Random)</button>
  {/if}

  <TwoPlayerEarlyEnd
    {drawOffer}
    onResign={() => gameState.sendResign()}
    onDrawOffer={() => gameState.sendDrawOffer()}
    onDrawReject={() => gameState.sendDrawReject()}
  />
{/if}

<div>
  Game Mode: {getGameModeString(gameState.mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
