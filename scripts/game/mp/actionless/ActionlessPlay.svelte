<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { ActionlessGame } from './ActionlessGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: ActionlessGame
}

const { gameState }: Props = $props()
</script>

<div class="mb-2">
  {#if gameState.roundState === GameState.WAITING}
    Waiting for players&hellip;
  {:else}
    {#if gameState.roundState === GameState.INTERMISSION}
      Intermission:
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

<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
