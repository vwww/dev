<script lang="ts">
import Board from '@gc/t3/Board.svelte'
import BoardCell from '@gc/t3/BoardCell.svelte'

import T3Game from './T3Game'

import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import TwoPlayerEarlyEnd from '@gmc/TwoPlayerEarlyEnd.svelte'

import { getGameModeString } from './gamemode'

export let gameState: T3Game
export let t3Isomorphism: number

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
  boardState,
  boardBad,
  winner,
  moveHistory,
  modeTurnTime,
  modeInverted,
  modeChecked,
  modeQuick,
} = gameState

$: playing = $isActive && $roundState === 2 && $inRound
$: canMove = playing && $myTurn

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

{#if !t3Isomorphism}
  <p>
    You are
    {#if !$myPlayer}
      <span class="badge bg-secondary">spectating</span>.
    {:else if $myPlayer === 1}
      <span class="badge bg-success">player X</span>.
    {:else}
      <span class="badge bg-danger">player O</span>.
    {/if}
    Get 3 in a row to win.
  </p>
  <Board let:i winner={$winner}>
    <BoardCell
      winner={$winner}
      mark={($boardState >> (i << 1)) & 3}
      markHover={canMove && !(($boardBad >> i) & 1) ? $myPlayer : 0}
      hintClass={(($boardState >> (i << 1)) & 3) || !(($boardBad >> i) & 1) ? '' : 'hlose'}
      onMove={() => gameState.sendMove(i)} />
  </Board>

  <div>
    Moves:
    {#each $moveHistory as move, i}
      <span class={`badge bg-${(i & 1) ? 'danger' : 'success'} me-1`}>{move}</span>
    {:else}
      (none)
    {/each}
  </div>
{:else}
  <p>
    You are
    {#if !$myPlayer}
      <span class="badge bg-secondary">spectating</span>.
    {:else if $myPlayer === 1}
      <span class="badge bg-success">player X</span>.
    {:else}
      <span class="badge bg-primary">player O</span>.
    {/if}
    Take 3 {['numbers that sum to 15', 'words that have the same letter'][t3Isomorphism - 1]}.
  </p>
  <div class="m-auto text-center">
    <div class="btn-group">
      {#each (t3Isomorphism === 1 ? isomorphism1 : isomorphism2) as [displayText, i]}
        <button
          class={`btn btn-${formatButtonClass(i, $boardState, $boardBad, canMove)}`}
          on:click={() => gameState.sendMove(i)}
        >{displayText}</button>
      {/each}
    </div>
  </div>
{/if}

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
