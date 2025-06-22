<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { type BlackjackGame } from './BlackjackGame2.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: BlackjackGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  // playing,
  canMove,
  // playerInfo,
  // playerDiscInfo,
  // myHand,
} = $derived(gameState)
</script>

{#if roundState === GameState.WAITING}
  Waiting for players&hellip;
{:else}
  {#if roundState === GameState.INTERMISSION}
    Intermission:
  {:else if canMove}
    Make a move:
  {:else if localClient.inRound}
    Waiting for opponent to move&hellip;
  {:else}
    Spectating:
  {/if}
  <ProgressBar
    startTime={gameState.roundTimerStart}
    endTime={gameState.roundTimerEnd}
    active={gameState.room} />
{/if}

<div>
  Game Mode: {getGameModeString(gameState.mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />

<CardCountTable
  ranks={['A', 'Tens', '9', '8', '7', '6', '5', '4', '3', '2']}
  counts={[
    ['Remaining', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Played', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Total', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
  ]}
/>
