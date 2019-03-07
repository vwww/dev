<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import MorraGame from './MorraGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: MorraGame
}

const { gameState }: Props = $props()

let nextNumber = $state(0)

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
} = $derived(gameState)

const canMove = $derived(isActive && roundState === 2 && inRound)

export function randomizeNextNumber () {
  return nextNumber = Math.floor(Math.random() * 8000000000001)
}
</script>

{#if roundState === 0}
  Waiting for players&hellip;
{:else}
  {#if roundState === 1}
    Intermission:
  {:else if canMove}
    Make a move:
  {:else}
    Results are coming soon:
  {/if}
  <ProgressBar startTime={roundTimerStart} endTime={roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString(modeInverted, modeAddRandom, modeTeams)}
</div>

{#if roundState === 2 && canMove}
  <input type="number" class="form-control is-{pendingMove === nextNumber ? '' : 'in'}valid" bind:value={nextNumber} onchange={() => gameState.sendMove(nextNumber)} min="0" max="8000000000000">
  <input type="range" class="form-range" bind:value={nextNumber} onchange={() => gameState.sendMove(nextNumber)} min="0" max="8000000000000">
{/if}

<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />
