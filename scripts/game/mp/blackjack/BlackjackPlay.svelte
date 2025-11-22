<script lang="ts">
import { sum } from '@/util'
import CardCountInline from '@gmc/CardCountInline.svelte'
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { BlackjackModeDouble, BlackjackModeSurrender, BlackjackMove, CardValue, GamePhase, MAX_BALANCE, type BlackjackGame } from './BlackjackGame.svelte'
import BlackjackHand from './BlackjackHand.svelte'
import BlackjackHistory from './BlackjackHistory.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: BlackjackGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  canMove,
  playerInfo,
  turnIndex,
  playerDiscInfo,
  mode,
  gamePhase,
  dealerHand,
  localPlayer,
  result,
} = $derived(gameState)
</script>

<script module>
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Total']
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

<div class="my-2 text-center">
  Game Phase: { roundState === GameState.ACTIVE ? ['Bet', 'Pre-Play', 'Play', 'Post-Play'][gamePhase] : 'Inactive' }
</div>

{#if roundState === GameState.ACTIVE}
  {#if gamePhase !== GamePhase.BET}
    {@const hasHole = dealerHand.cards.length < 2 && !!mode.optDealer}
    <div class="my-2 text-center">
      <p>Dealer: <BlackjackHand hand={dealerHand} hole={hasHole} /></p>
      {#if hasHole}
        <p>Possible hole card: <CardCountInline {ranks} cards={gameState.cardCountHole} /></p>
      {/if}
    </div>
  {/if}

  <div class="my-2">
    {#if localPlayer}
      {#if gamePhase === GamePhase.BET}
        {@const max = Math.max(2, localClient.balance < -100 ? 100
          : localClient.balance < (Number(MAX_BALANCE) - 200) / 2
            ? Number(localClient.balance) + 200
            : Number(MAX_BALANCE - localClient.balance))}
        <div>
          Bet Amount
          <input type="number" class="form-control is-{gameState.pendingAmount === Number(localPlayer.bet) ? '' : 'in'}valid" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveInsurance()} min="2" {max}>
          <input type="range" class="form-range" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveBet()} min="2" {max}>
        </div>

        <div class="text-center">
          <button class="btn btn-info btn-lg" class:disabled={localPlayer.ready} onclick={() => gameState.sendMoveReady()}>&#9989; Ready</button>
        </div>
      {:else}
        {#if localPlayer.handIndex < localPlayer.hands.length}
          {@const handBet = localPlayer.hands[localPlayer.handIndex]}
          {@const [hand, bet] = handBet}
          <p class="text-center">You bet <span class="badge text-bg-outline-secondary">{bet}</span> on <BlackjackHand {hand} /></p>
        {/if}
        {#if canMove}
          {#if gamePhase === GamePhase.PLAY}
            {@const handBet = localPlayer.hands[localPlayer.handIndex]}
            {#if handBet}
              {@const [hand] = handBet}
              {@const handCount = localPlayer.hands.length}
              <div class="text-center">
                <button class="btn btn{mode.opt21
                  || hand.cards.length > 2
                  || handCount > 1 && (!mode.optSplitDouble || !mode.optSplitAceAdd  && hand.cards[0] === CardValue.Ace)
                  || mode.optDouble !== BlackjackModeDouble.ANY && (hand.valueHard < (mode.optDouble == BlackjackModeDouble.ON_10_11 ? 10 : 9) || hand.valueHard > 11)
                    ? '-outline' : ''}-warning btn-lg"
                  class:d-none={mode.opt21}
                  onclick={() => gameState.sendMove(BlackjackMove.DOUBLE)}>&#8252;&#65039; Double</button>
                <button class="btn btn{!mode.optSplitAceAdd && handCount > 1 && hand.cards[0] === CardValue.Ace
                  ? '-outline' : ''}-success btn-lg"
                  onclick={() => gameState.sendMove(BlackjackMove.HIT)}>&#11014;&#65039; Hit</button>
                <button class="btn btn-danger btn-lg"
                  onclick={() => gameState.sendMove(BlackjackMove.STAND)}>&#9940; Stand</button>
                <button class="btn btn{mode.opt21
                  || hand.cards.length > 2
                  || hand.cards[0] !== hand.cards[1]
                  || handCount > (hand.cards[0] === CardValue.Ace ? mode.optSplitAce : mode.optSplitNonAce)
                    ? '-outline' : ''}-primary btn-lg"
                  class:d-none={mode.opt21}
                  onclick={() => gameState.sendMove(BlackjackMove.SPLIT)}>&harr;&#65039; Split</button>
                <button class="btn btn{mode.opt21
                  || !mode.optHitSurrender && hand.cards.length > 2
                  || mode.optSurrender == BlackjackModeSurrender.OFF
                  || mode.optSurrender == BlackjackModeSurrender.NOT_ACE && dealerHand.cards[1] === CardValue.Ace
                  || handCount > 1 && !mode.optSplitSurrender
                    ? '-outline' : ''}-secondary btn-lg"
                  class:d-none={mode.opt21}
                  onclick={() => gameState.sendMove(BlackjackMove.SURRENDER)}>&#127987; Surrender</button>
              </div>
            {/if}
          {:else}
            {#if dealerHand.cards.at(-1) === CardValue.Ace && (gamePhase === GamePhase.POST || !mode.optInsureLate)}
              {@const max = sum(localPlayer.hands.map(([_, b]) => b < 0 ? 0 : Number(b >> 1n)))}
              {@const step = mode.optInsurePartial ? 1 : Number(localPlayer.bet)}
              <div>
                Insurance Amount
                <input type="number" class="form-control is-{gameState.pendingAmount === Number(localPlayer.insurance) ? '' : 'in'}valid" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveInsurance()} min="0" {max} {step}>
                <input type="range" class="form-range" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveInsurance()} min="0" {max} {step}>
              </div>
            {/if}

            <div class="text-center">
              <button class="btn btn-info btn-lg" class:disabled={localPlayer.ready} onclick={() => gameState.sendMoveReady()}>&#9989; Ready</button>
              {#if gamePhase === GamePhase.PRE}
                <button class="btn btn-secondary btn"
                  class:disabled={
                    localPlayer.handIndex
                    || mode.optSurrender == BlackjackModeSurrender.OFF
                    || mode.optSurrender == BlackjackModeSurrender.NOT_ACE && dealerHand.cards[1] === CardValue.Ace}
                  onclick={() => gameState.sendMove(BlackjackMove.SURRENDER)}>&#127987; Surrender</button>
              {/if}
            </div>
          {/if}
        {/if}
      {/if}
    {/if}
  </div>

  <b>Active Players</b>
  <ol class="list-unstyled">
    {#each playerInfo as p, pi}
      {@const isMe = gameState.playerIsMe(p)}
      {@const outline = isMe ? '' : '-outline'}
      <li>
        <span class="badge text-bg{outline}-secondary">{gameState.formatPlayerName(p)}</span>
        {#if gamePhase !== GamePhase.PLAY}
          <span class="badge text-bg-{p.ready ? '' : 'outline-'}info">{p.ready ? 'READY' : 'UNREADY'}</span>
        {/if}
        {#if gamePhase === GamePhase.BET}
          <span class="badge text-bg-outline-secondary">{p.bet}</span>
        {:else}
          {#if p.insurance}
            Insurance <span class="badge text-bg-outline-secondary">{p.insurance}</span>
          {/if}
          <ol class="list-unstyled">
            {#each p.hands as [hand, bet], hi}
              <li>
                <span class="badge text-bg-outline-secondary">{bet < 0 ? -bet : bet}</span> on <BlackjackHand {hand} />
                {#if (mode.optSpeed || pi === turnIndex) && hi === p.handIndex}<span class="badge text-bg{outline}-primary">MOVE</span>{/if}
              </li>
            {/each}
          </ol>
        {/if}
      </li>
    {:else}
      <li>No players!</li>
    {/each}
  </ol>

  {#if playerDiscInfo.length}
    <b>Disconnected Players</b>
    <ol class="list-unstyled">
      {#each playerDiscInfo as p}
        <li>
          <span class="badge text-bg{p.isMe ? '' : '-outline'}-secondary">{p.ownerName}</span>
          <span class="badge text-bg-{p.scoreChange ? p.scoreChange < 0 ? 'danger' : 'success' : 'warning'}">{p.scoreChange >= 0 ? '+' : ''}{p.scoreChange}</span> &rarr; {p.score}
          <ol class="list-unstyled">
            {#if p.insurance}
              <li>Insurance lost <span class="badge text-bg-outline-danger">-{p.insurance}</span></li>
            {/if}
            {#each p.hands as [hand, bet]}
              <li>
                <span class="badge text-bg-outline-secondary">{bet < 0 ? -bet : bet}</span> on <BlackjackHand {hand} />
                {#if bet < 0}
                  <span class="badge text-bg-outline-secondary">SURRENDERED</span>
                  <span class="badge text-bg-outline-danger">{bet >> 1n}</span>
                {:else if hand.value > 21}
                  <span class="badge text-bg-secondary">BUST</span>
                  <span class="badge text-bg-outline-danger">-{bet}</span>
                {:else if hand.isNaturalBlackjack(p.hands.length > 1)}
                  <span class="badge text-bg-warning">PUSH</span>
                  <span class="badge text-bg-outline-secondary">+0</span>
                {:else}
                  <span class="badge text-bg-danger">LOSE</span>
                  <span class="badge text-bg-outline-danger">-{bet}</span>
                {/if}
              </li>
            {/each}
          </ol>
        </li>
      {/each}
    </ol>
  {/if}
{:else if result}
  <BlackjackHistory {result} />
{/if}

<div class="mt-2">
  <CardCountTable
    {ranks}
    counts={[
      [gameState.cardCountShoeHasHole ? 'Shoe+Hole' : 'Shoe', gameState.cardCountShoe],
      ['Played', gameState.cardCountPlayed],
      ['Total', gameState.cardCountTotal],
    ]}
  />
</div>

<div>
  Game Mode: {getGameModeString(mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
