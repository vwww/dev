<script>
import ProgressBar from '../common/ProgressBar'
import RoundPlayerList from '../common/RoundPlayerList'
import TwoPlayerEarlyEnd from '../common/TwoPlayerEarlyEnd'

import Board from './Board'

import { getGameModeString } from './gamemode'

export let gameState

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
    <span class="badge badge-secondary">spectating</span>.
  {:else if $myPlayer === 1}
    <span class="badge badge-success">player X</span>.
  {:else}
    <span class="badge badge-danger">player O</span>.
  {/if}
</p>

<Board
  winner={$winner}
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
    <div class="input-group-prepend">
      <span class="input-group-text">Navigate</span>
    </div>
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
      class={`badge badge-${$boardIndex <= i ? 'warning' : (i & 1) ? 'danger' : 'success'} mr-1`}
      on:click={() => gameState.historyGo(i + 1)}
      >{move.join('')}</span>
  {:else}
    (none)
  {/each}
</div>

{#if playing}
  {#if canMove}
    <button
      class="btn btn-outline-secondary btn-block my-2"
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
