<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import TwoPlayerEarlyEnd from '@gmc/TwoPlayerEarlyEnd.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { Winner } from '@/game/common/t3/game'

import type { UT3Game } from './UT3Game.svelte'

import Board from './Board.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: UT3Game
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  playing,
  canMove,
  myPlayer,
  drawOffer,
  boardStates,
  boardIndex,
  winner,
  moveHistory,
} = $derived(gameState)

const boardState = $derived(boardStates[boardIndex])

const ply = $derived(moveHistory.length)
const showingCurrent = $derived(boardIndex >= ply)
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

<p>
  You are
  {#if roundState === GameState.WAITING}
    <span class="badge text-bg-secondary">spectating</span>.
  {:else if myPlayer === 1}
    <span class="badge text-bg-success">player X</span>.
  {:else}
    <span class="badge text-bg-danger">player O</span>.
  {/if}
  {#if winner === Winner.P1}
    <span class="badge text-bg-success">X wins!</span>
  {:else if winner === Winner.P2}
    <span class="badge text-bg-danger">O wins!</span>
  {:else if winner === Winner.Tie}
    It's a <span class="badge text-bg-warning">draw</span>!
  {/if}
</p>

<Board
  {boardState}
  markHover={canMove && showingCurrent ? myPlayer : 0}
  onMove={(i, j) => showingCurrent && gameState.sendMove(i, j)}
/>

<div>
  <div class="progress mb-2">
    <div
      class="progress-bar progress-bar-striped {canMove ? !showingCurrent ? 'text-bg-warning' : 'text-bg-success' : ''}"
      style="width:{(boardIndex + 1) / (ply + 1) * 100}%"
    >Ply {boardIndex}{#if !showingCurrent}/{ply}{/if}</div>
  </div>

  <div class="btn-group d-flex mb-3" role="group">
    <span class="input-group-text">Navigate</span>
    <button class="w-100 btn btn-secondary"
      class:disabled={!boardIndex}
      onclick={() => gameState.historyGo(0)}>&laquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={!boardIndex}
      onclick={() => gameState.historyGo(boardIndex - 1)}>&lsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={showingCurrent}
      onclick={() => gameState.historyGo(boardIndex + 1)}>&rsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={showingCurrent}
      onclick={() => gameState.historyGo(ply)}>&raquo;</button>
  </div>

  Moves:
  {#each moveHistory as move, i}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <span
      class="badge text-bg{myPlayer == (i & 1) + 1 ? '' : '-outline'}-{boardIndex <= i ? 'warning' : (i & 1) ? 'danger' : 'success'} me-1"
      onclick={() => gameState.historyGo(i + 1)}
      role="button"
      tabindex="0"
      >{move.join('')}</span>
  {:else}
    (none)
  {/each}
</div>

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
  inQueue={gameState.roundPlayerQueue}
  spectators={gameState.spectators} />
