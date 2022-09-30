<script lang="ts">
import ProgressBar from '../common/ProgressBar.svelte'
import RoundPlayerList from '../common/RoundPlayerList.svelte'
import TwoPlayerEarlyEnd from '../common/TwoPlayerEarlyEnd.svelte'

import UT3Game from './UT3Game'

import Board from './Board.svelte'

import { getGameModeString } from './gamemode'

export let gameState: UT3Game

const {
  isActive,
  inRound,
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  myTurn,
  myPlayer,
  drawOffer,
  boardStates,
  boardIndex,
  winner,
  moveHistory,
  modeTurnTime,
  modeInverted,
  modeChecked,
  modeQuick,
} = gameState

$: playing = $isActive && $roundState === 2 && $inRound
$: canMove = playing && $myTurn
$: boardState = $boardStates[$boardIndex]
</script>

{#if !$roundState}
  Waiting for players&hellip;
{:else}
  {#if $roundState === 1}
    Intermission:
  {:else if canMove}
    Make a move:
  {:else if $inRound}
    Waiting for opponent to move&hellip;
  {:else}
    Spectating:
  {/if}
  <ProgressBar startTime={$roundTimerStart} endTime={$roundTimerEnd} />
{/if}

<p>
  You are
  {#if !$myPlayer}
    <span class="badge bg-secondary">spectating</span>.
  {:else if $myPlayer === 1}
    <span class="badge bg-success">player X</span>.
  {:else}
    <span class="badge bg-danger">player O</span>.
  {/if}
  {#if $winner === 1}
    <span class="badge bg-success">X wins!</span>
  {:else if $winner === 2}
    <span class="badge bg-danger">O wins!</span>
  {:else if $winner === 3}
    It's a <span class="badge bg-warning">draw</span>!
  {/if}
</p>

<Board
  {boardState}
  markHover={canMove && $boardIndex === $moveHistory.length ? $myPlayer : 0}
  onMove={(i, j) => gameState.sendMove(i, j)}
/>

<div>
  <div class="progress mb-2">
    <div
      class={`progress-bar progress-bar-striped ${canMove ? $boardIndex < $moveHistory.length ? 'bg-warning' : 'bg-success' : ''}`}
      style="width:{($boardIndex + 1) / ($moveHistory.length + 1) * 100}%"
    >Ply {$boardIndex}{#if $boardIndex < $moveHistory.length}/{$moveHistory.length}{/if}</div>
  </div>

  <div class="btn-group d-flex mb-3" role="group">
    <span class="input-group-text">Navigate</span>
    <button class="w-100 btn btn-secondary"
      class:disabled={!$boardIndex}
      on:click={() => gameState.historyGo(0)}>&laquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={!$boardIndex}
      on:click={() => gameState.historyGo($boardIndex - 1)}>&lsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={$boardIndex >= $moveHistory.length}
      on:click={() => gameState.historyGo($boardIndex + 1)}>&rsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={$boardIndex >= $moveHistory.length}
      on:click={() => gameState.historyGo($moveHistory.length)}>&raquo;</button>
  </div>

  Moves:
  {#each $moveHistory as move, i}
    <span
      class={`badge bg-${$boardIndex <= i ? 'warning' : (i & 1) ? 'danger' : 'success'} me-1`}
      on:click={() => gameState.historyGo(i + 1)}
      >{move.join('')}</span>
  {:else}
    (none)
  {/each}
</div>

{#if playing}
  {#if canMove}
    <button
      class="btn btn-outline-secondary d-block w-100 my-2"
      on:click={() => gameState.sendMoveEnd()}>End Turn (Auto Random)</button>
  {/if}

  <TwoPlayerEarlyEnd
    drawOffer={$drawOffer}
    onResign={() => gameState.sendResign()}
    onDrawOffer={() => gameState.sendDrawOffer()}
    onDrawReject={() => gameState.sendDrawReject()}
  />
{/if}

<div>
  Game Mode: {getGameModeString($modeInverted, $modeChecked, $modeQuick, $modeTurnTime)}
</div>

<b>Lobby</b>
<RoundPlayerList inGame={$roundPlayers} inQueue={$roundPlayerQueue} />
