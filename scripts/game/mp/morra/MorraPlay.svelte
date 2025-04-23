<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { MorraGame } from './MorraGame2.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: MorraGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  pendingMove,
  pendingMoveAck,
  mode,
} = $derived(gameState)

const canMove = $derived(localClient.active && roundState == GameState.ACTIVE && localClient.inRound)
</script>

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
  <ProgressBar startTime={roundTimerStart} endTime={roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString(mode)}
</div>

{#if canMove}
  <input type="number" class="form-control is-{pendingMove === pendingMoveAck ? '' : 'in'}valid" bind:value={gameState.pendingMove} onchange={() => gameState.sendMove()} min="0" max="8000000000000">
  <input type="range" class="form-range" bind:value={gameState.pendingMove} onchange={() => gameState.sendMove()} min="0" max="8000000000000">
{/if}

<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />
