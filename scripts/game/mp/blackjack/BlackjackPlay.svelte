<script lang="ts">
import { sum } from '@/util'
import CardCountInline from '@gmc/CardCountInline.svelte'
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { BlackjackModeDealer, BlackjackModeDouble, BlackjackModeSurrender, BlackjackMove, CardValue, GamePhase, MAX_BALANCE, type BlackjackGame } from './BlackjackGame.svelte'
import BlackjackHand from './BlackjackHand.svelte'
import BlackjackHandBetOutcome from './BlackjackHandBetOutcome.svelte'
import BlackjackHistory from './BlackjackHistory.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: BlackjackGame
  showCardCount: boolean
}

const { gameState, showCardCount }: Props = $props()

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

<div class="mb-2">
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
</div>

<div class="my-3 text-center">
  Game Phase: { roundState === GameState.ACTIVE ? ['Bet', 'Pre-Play', 'Play', 'Post-Play'][gamePhase] : 'Inactive' }
  {#if localClient.balance || localClient.active}
    <br>
    Balance: <span class="badge text-bg-secondary">{localClient.balance}</span>
  {/if}
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

  {#if localPlayer}
    <div class="my-3">
      {#if gamePhase === GamePhase.BET}
        {@const max = Math.max(2, localClient.balance < -100 ? 100
          : localClient.balance < (Number(MAX_BALANCE) - 200) / 2
            ? Number(localClient.balance) + 200
            : Number(MAX_BALANCE - BigInt(localClient.balance)))}
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
                  || mode.optDouble !== BlackjackModeDouble.ANY && (hand.valueHard < (mode.optDouble === BlackjackModeDouble.ON_10_11 ? 10 : 9) || hand.valueHard > 11)
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
                  class:d-none={mode.opt21 || !mode.optSplitAce && !mode.optSplitNonAce}
                  onclick={() => gameState.sendMove(BlackjackMove.SPLIT)}>&harr;&#65039; Split</button>
                <button class="btn btn{mode.opt21
                  || !mode.optHitSurrender && hand.cards.length > 2
                  || mode.optSurrender === BlackjackModeSurrender.OFF
                  || mode.optSurrender === BlackjackModeSurrender.NOT_ACE && dealerHand.cards.at(-1) === CardValue.Ace
                  || handCount > 1 && !mode.optSplitSurrender
                    ? '-outline' : ''}-secondary btn-lg"
                  class:d-none={mode.opt21 || mode.optSurrender === BlackjackModeSurrender.OFF}
                  onclick={() => gameState.sendMove(BlackjackMove.SURRENDER)}>&#127987; Surrender</button>
              </div>
            {/if}
          {:else}
            {#if dealerHand.cards.at(-1) === CardValue.Ace && (gamePhase === GamePhase.POST || !mode.optInsureLate)}
              {@const max = sum(localPlayer.hands.map(([_, b]) => b < 0 ? 0 : Number(b / 2)))}
              {@const step = mode.optInsurePartial ? 1 : Number(localPlayer.bet / 2)}
              <div>
                Insurance Amount
                <input type="number" class="form-control is-{gameState.pendingAmount === Number(localPlayer.insurance) ? '' : 'in'}valid" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveInsurance()} min="0" {max} {step}>
                <input type="range" class="form-range" bind:value={gameState.pendingAmount} onchange={() => gameState.sendMoveInsurance()} min="0" {max} {step}>
              </div>
            {/if}

            <div class="text-center">
              <button class="btn btn-info btn-lg" class:disabled={localPlayer.ready} onclick={() => gameState.sendMoveReady()}>&#9989; Ready</button>
              {#if gamePhase === GamePhase.PRE && mode.optSurrender !== BlackjackModeSurrender.OFF}
                <button class="btn btn-secondary btn"
                  class:disabled={
                    localPlayer.handIndex
                    || mode.optSurrender === BlackjackModeSurrender.NOT_ACE && dealerHand.cards.at(-1) === CardValue.Ace}
                  onclick={() => gameState.sendMove(BlackjackMove.SURRENDER)}>&#127987; Surrender</button>
              {/if}
            </div>
          {/if}
        {/if}
      {/if}
    </div>
  {/if}

  <div class="text-center">
    <div class="d-inline-block text-start">
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
                Insurance
                <span class="badge text-bg-outline-secondary">{p.insurance}</span>
                {mode.optDealer >= BlackjackModeDealer.HOLE0 && gamePhase === GamePhase.PLAY ? 'lost' : ''}
              {/if}
              <ol class="list-unstyled">
                {#each p.hands as [hand, bet], hi}
                  <li>
                    Bet <span class="badge text-bg-outline-secondary">{bet < 0 ? -bet : bet}</span> on <BlackjackHand {hand} final={hi < p.handIndex} />
                    {#if !gameState.dealerCanBJ() && hand.isNaturalBlackjack(p.hands.length > 1)}
                      <span class="badge text-bg-primary">BLACKJACK</span>
                    {:else if gamePhase > GamePhase.PLAY || mode.optSpeed || pi <= turnIndex}
                      {#if hi < p.handIndex}
                        {#if bet < 0}
                          <span class="badge text-bg-outline-secondary">SURRENDERED</span>
                        {:else if hand.value > 21}
                          <span class="badge text-bg-secondary">BUST</span>
                        {:else}
                          <span class="badge text-bg-outline-info">PENDING</span>
                        {/if}
                      {:else if hi === p.handIndex}
                        <span class="badge text-bg{outline}-warning">MOVE</span>
                      {/if}
                    {/if}
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
                {#each p.hands as hand}
                  <li>
                    <BlackjackHandBetOutcome {hand} />
                  </li>
                {/each}
              </ol>
            </li>
          {/each}
        </ol>
      {/if}
    </div>
  </div>
{:else if result}
  <div class="my-3 text-center">
    <div class="d-inline-block text-start">
      <BlackjackHistory {result} />
    </div>
  </div>
{/if}

<div class="mt-2">
  {#if showCardCount}
    <CardCountTable
      {ranks}
      counts={[
        [gameState.cardCountShoeHasHole ? 'Shoe+Hole' : 'Shoe', gameState.cardCountShoe],
        ['Played', gameState.cardCountPlayed],
        ['Total', gameState.cardCountTotal],
      ]}
    />
  {:else}
    <p>Shoe count: {gameState.cardCountShoe[CardValue.NUM] - (gameState.cardCountShoeHasHole ? 1n : 0n)}</p>
  {/if}
</div>

<div>
  Game Mode: {getGameModeString(mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
