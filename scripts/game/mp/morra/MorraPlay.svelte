<script>
import ProgressBar from '../common/ProgressBar'
import RoundPlayerList from '../common/RoundPlayerList'

import { getGameModeString } from './gamemode'

export let gameState

let nextNumber = 0

const {
  isActive,
  inRound,
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  pendingMove,
  modeInverted,
  modeAddRandom,
  modeTeams,
} = gameState

$: canMove = $isActive && $roundState === 2 && $inRound

export function randomizeNextNumber () {
  return nextNumber = Math.floor(Math.random() * 8000000000000)
}
</script>

{#if $roundState === 0}
  Waiting for players&hellip;
{:else}
  {#if $roundState === 1}
    Intermission:
  {:else if canMove}
    Make a move:
  {:else}
    Results are coming soon:
  {/if}
  <ProgressBar startTime={$roundTimerStart} endTime={$roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString($modeInverted, $modeAddRandom, $modeTeams)}
</div>

{#if $roundState === 2 && canMove}
  <input type="number" class="form-control is-{$pendingMove === nextNumber ? '' : 'in'}valid" bind:value={nextNumber} on:change={gameState.sendMove(nextNumber)} min="0" max="8000000000000">
  <input type="range" class="custom-range" bind:value={nextNumber} on:change={gameState.sendMove(nextNumber)} min="0" max="8000000000000">
{/if}

<RoundPlayerList inGame={$roundPlayers} inQueue={$roundPlayerQueue} />
