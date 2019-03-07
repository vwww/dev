<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { RPSGame } from './RPSGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: RPSGame
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
  <div class="btn-group d-flex mb-3" role="group">
    <span class="input-group-text">Next Move</span>
    {#each ['Auto', '\u{1F94C} Rock', '\u{1F4C4} Paper', '\u2702 Scissors'] as move, i}
      <button
        onclick={() => gameState.sendMove(i)}
        class:active={gameState.pendingMove === i}
        class="w-100 btn btn-outline-secondary">{move}</button>
    {/each}
  </div>
{/if}

<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
