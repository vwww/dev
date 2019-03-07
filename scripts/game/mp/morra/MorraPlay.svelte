<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { MorraGame } from './MorraGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: MorraGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
} = $derived(gameState)

const canMove = $derived(localClient.active && roundState == GameState.ACTIVE && localClient.inRound)
</script>

<div class="mb-2">
  {#if roundState === GameState.WAITING}
    Waiting for players&hellip;
  {:else}
    {#if roundState === GameState.INTERMISSION}
      Intermission:
    {:else if canMove}
      Make a move:
    {:else}
      Results are coming soon:
    {/if}
    <ProgressBar
      startTime={gameState.roundTimerStart}
      endTime={gameState.roundTimerEnd}
      active={gameState.room} />
  {/if}
</div>

<div>
  Game Mode: {getGameModeString(gameState.mode)}
</div>

{#if canMove}
  <input type="number" class="form-control is-{gameState.pendingMove === gameState.pendingMoveAck ? '' : 'in'}valid" bind:value={gameState.pendingMove} onchange={() => gameState.sendMove()} min="0" max="9007199254740992">
  <input type="range" class="form-range" bind:value={gameState.pendingMove} onchange={() => gameState.sendMove()} min="0" max="9007199254740992">
{/if}

<RoundPlayerList
  localClient={localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
