<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'

import ActionlessGame from './ActionlessGame.svelte'

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
  modeIndependent,
  modeTeam,
} = $derived(gameState)

</script>

{#if roundState === 0}
  Waiting for players&hellip;
{:else}
  {#if roundState === 1}
    Intermission:
  {:else}
    Results are coming soon:
  {/if}
  <ProgressBar startTime={roundTimerStart} endTime={roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString(modeIndependent, modeTeam)}
</div>

<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />
