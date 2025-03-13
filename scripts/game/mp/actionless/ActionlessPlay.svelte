<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import { GameState, type ActionlessGame } from './ActionlessGame2.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: ActionlessGame
}

const { gameState }: Props = $props()

const {
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  mode,
} = $derived(gameState)

</script>

{#if roundState === GameState.WAITING}
  Waiting for players&hellip;
{:else}
  {#if roundState === GameState.INTERMISSION}
    Intermission:
  {:else}
    Results are coming soon:
  {/if}
  <ProgressBar startTime={roundTimerStart} endTime={roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString(mode)}
</div>

<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />
