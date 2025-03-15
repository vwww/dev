<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import { GameState, type RPSGame } from './RPSGame2.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: RPSGame
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
  <div class="btn-group d-flex mb-3" role="group">
    <span class="input-group-text">Next Move</span>
    {#each ['Auto', '\u{1F94C} Rock', '\u{1F4C4} Paper', '\u2702 Scissors'] as move, i}
      <button
        onclick={() => gameState.sendMove(i)}
        class:active={pendingMove === i}
        class="w-100 btn btn-outline-secondary">{move}</button>
    {/each}
  </div>
{/if}

<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />
