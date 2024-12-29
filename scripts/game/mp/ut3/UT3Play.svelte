<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import TwoPlayerEarlyEnd from '@gmc/TwoPlayerEarlyEnd.svelte'

import UT3Game from './UT3Game'

import Board from './Board.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: UT3Game
}

const { gameState }: Props = $props()

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

const playing = $derived($isActive && $roundState === 2 && $inRound)
const canMove = $derived(playing && $myTurn)
const boardState = $derived($boardStates[$boardIndex])
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
    <span class="badge text-bg-secondary">spectating</span>.
  {:else if $myPlayer === 1}
    <span class="badge text-bg-success">player X</span>.
  {:else}
    <span class="badge text-bg-danger">player O</span>.
  {/if}
  {#if $winner === 1}
    <span class="badge text-bg-success">X wins!</span>
  {:else if $winner === 2}
    <span class="badge text-bg-danger">O wins!</span>
  {:else if $winner === 3}
    It's a <span class="badge text-bg-warning">draw</span>!
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
      class="progress-bar progress-bar-striped {canMove ? $boardIndex < $moveHistory.length ? 'text-bg-warning' : 'text-bg-success' : ''}"
      style="width:{($boardIndex + 1) / ($moveHistory.length + 1) * 100}%"
    >Ply {$boardIndex}{#if $boardIndex < $moveHistory.length}/{$moveHistory.length}{/if}</div>
  </div>

  <div class="btn-group d-flex mb-3" role="group">
    <span class="input-group-text">Navigate</span>
    <button class="w-100 btn btn-secondary"
      class:disabled={!$boardIndex}
      onclick={() => gameState.historyGo(0)}>&laquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={!$boardIndex}
      onclick={() => gameState.historyGo($boardIndex - 1)}>&lsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={$boardIndex >= $moveHistory.length}
      onclick={() => gameState.historyGo($boardIndex + 1)}>&rsaquo;</button>
    <button class="w-100 btn btn-secondary"
      class:disabled={$boardIndex >= $moveHistory.length}
      onclick={() => gameState.historyGo($moveHistory.length)}>&raquo;</button>
  </div>

  Moves:
  {#each $moveHistory as move, i}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <span
      class="badge text-bg-{$boardIndex <= i ? 'warning' : (i & 1) ? 'danger' : 'success'} me-1"
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
