<script>
import ProgressBar from '../common/ProgressBar'
import RoundPlayerList from '../common/RoundPlayerList'

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
  pendingMove,
  modeClassic,
  modeInverted,
  modeCount,
  modeRoundTime,
  modeBotBalance
} = gameState

$: canMove = $isActive && $roundState === 2 && $inRound
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
  Game Mode: {getGameModeString($modeClassic, $modeInverted, $modeCount, $modeRoundTime, $modeBotBalance)}
</div>

{#if $roundState === 2 && canMove}
  <div class="btn-group d-flex mb-3" role="group">
    <div class="input-group-prepend">
      <span class="input-group-text">Next Move</span>
    </div>
    {#each ['Auto', '\u{1F94C} Rock', '\u{1F4C4} Paper', '\u2702 Scissors'] as move, i}
      <button
        on:click={() => gameState.sendMove(i)}
        class:active={$pendingMove === i}
        class="w-100 btn btn-outline-secondary">{move}</button>
    {/each}
  </div>
{/if}

<RoundPlayerList inGame={$roundPlayers} inQueue={$roundPlayerQueue} />
