<script lang="ts">
import ProgressBar from '../common/ProgressBar.svelte'
import RoundPlayerList from '../common/RoundPlayerList.svelte'

import ActionlessGame from './ActionlessGame'

import { getGameModeString } from './gamemode'

export let gameState: ActionlessGame

const {
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  modeIndependent,
  modeTeam,
} = gameState

</script>

{#if $roundState === 0}
  Waiting for players&hellip;
{:else}
  {#if $roundState === 1}
    Intermission:
  {:else}
    Results are coming soon:
  {/if}
  <ProgressBar startTime={$roundTimerStart} endTime={$roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString($modeIndependent, $modeTeam)}
</div>

<RoundPlayerList inGame={$roundPlayers} inQueue={$roundPlayerQueue} />
