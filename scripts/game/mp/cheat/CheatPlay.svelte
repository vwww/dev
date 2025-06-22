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
  // playing,
  canMove,
  // playerDiscInfo,
  // myHand,
} = $derived(gameState)

const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', '*']
const cCountPlaceholder = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
</script>

{#if roundState == GameState.WAITING}
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

<div>
  Your cards
  <CardCountTable
    {ranks}
    counts={[
      ['Hand', cCountPlaceholder],
      ['Played', cCountPlaceholder],
      ['Yours', cCountPlaceholder],
    ]}
  />
</div>

<div>
  Actual cards
  <CardCountTable
    {ranks}
    counts={[
      ['Yours', cCountPlaceholder],
      ['Others', cCountPlaceholder],
      ['Total', cCountPlaceholder]
    ]}
  />
</div>

<div>
  Claimed cards
  <CardCountTable
    {ranks}
    counts={[
      ['Your Claim', cCountPlaceholder],
      ['Others Claim', cCountPlaceholder],
      ['Remaining Claim', cCountPlaceholder],
      ['Total', cCountPlaceholder]
    ]}
  />
</div>
