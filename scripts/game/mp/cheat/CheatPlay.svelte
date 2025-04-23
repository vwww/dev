<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import type { CheatGame } from './CheatGame2.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: CheatGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  playerInfo,
  // playerDiscInfo,
  // myHand,
  mode,
} = $derived(gameState)

const playing = $derived(localClient.active && roundState == GameState.ACTIVE && localClient.inRound)
const canMove = $derived(playing && gameState.playerIsMe(playerInfo[0]))
</script>

{#if !roundState}
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
  <ProgressBar startTime={roundTimerStart} endTime={roundTimerEnd} />
{/if}

<div>
  Game Mode: {getGameModeString(mode)}
</div>

<b>Lobby</b>
<RoundPlayerList inGame={roundPlayers} inQueue={roundPlayerQueue} />

<CardCountTable
  ranks={['*', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'A']}
  counts={[
    ['Yours Actual', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Others Actual', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Your Hand', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Your Played', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Your Claim', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Others Claim', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Remaining Claim', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]],
    ['Total', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]]
  ]}
/>
