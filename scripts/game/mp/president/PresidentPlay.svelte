<script lang="ts">
import { formatDuration } from '@gmc/game/common'
import CardCountBars from '@gmc/CardCountBars.svelte'
import CardCountInline from '@gmc/CardCountInline.svelte'
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import PresidentMoveHistory from './PresidentMoveHistory.svelte'
import PresidentRole from './PresidentRole.svelte'
import PresidentRoleChange from './PresidentRoleChange.svelte'

import { CardRank, GamePhase, type PresidentGame } from './PresidentGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: PresidentGame
  showCardCount: boolean
}

const { gameState, showCardCount }: Props = $props()

const {
  localClient,
  roundState,
  playerInfo,
  turnIndex,
  playing,
  canMove,
  playerDiscInfo,
  moveHistory,
  gamePhase,
  trickTurn,
  trickCount,
} = $derived(gameState)

let showHandBars = $state(false)

function* playedCardGen (): Generator<[string, bigint[]]> {
  for (const p of playerInfo) {
    yield [gameState.clients[p.owner].formatName(), p.discarded]
  }
  for (const d of playerDiscInfo) {
    if (d.discarded[CardRank.NUM]) {
      yield [d.ownerName + ' (used)', d.discarded]
    }
    if (d.hand[CardRank.NUM]) {
      yield [d.ownerName + ' (hand)', d.hand]
    }
  }
}
</script>

<script module>
export const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2', '*', 'Total']
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
      Waiting for others to move&hellip;
    {:else}
      Spectating:
    {/if}
    <ProgressBar
      startTime={gameState.roundTimerStart}
      endTime={gameState.roundTimerEnd}
      active={gameState.room} />
  {/if}
</div>

<div class="row">
  <div class="col-12">
    <div class="my-2 text-center">
      Trick {gameState.trickNum}
      {#if trickTurn}
        Move {trickTurn}: <span class="badge text-bg-light">{ranks[gameState.trickRank]}</span> &times;{trickCount}{#if gameState.trick1Fewer}-1{/if}
      {:else}
        Move 0
      {/if}
      {#if gameState.mode.optRev}
        {#if gameState.revolution}
          <span class="badge text-bg-dark">REVOLUTION ON</span>
        {:else}
          <span class="badge text-bg-outline-dark">OFF REVOLUTION</span>
        {/if}
      {/if}
    </div>
    {#if roundState === GameState.ACTIVE && playing}
      {@const CardCountComponent = showHandBars ? CardCountBars : CardCountInline}
      <div class="my-2">
        <label class="form-check d-inline-block">
          <input type="checkbox" class="form-check-input" bind:checked={showHandBars}>
          <span class="form-check-label">Your hand:</span>
        </label>
        <CardCountComponent {ranks} cards={gameState.cardCountMine} />
      </div>

      {#if gamePhase === GamePhase.GIVE_CARDS}
        {@const give2 = (gameState.giveFlags & 2) && gameState.pres >= 0}
        {@const give1 = (gameState.giveFlags & 1) && gameState.vicePres >= 0}
        {@const give2me = give2 && playerInfo[gameState.pres].owner === localClient.cn}
        {@const give1me = give1 && playerInfo[gameState.vicePres].owner === localClient.cn}
        <div class="my-2">
          {#if give2me || give1me}
            <div>
              You got <span class="badge text-bg-light">{ranks[gameState.take0]}</span>
              {#if give2me}
                and <span class="badge text-bg-light">{ranks[gameState.take1]}</span>
              {/if}
              from the {give2me ? 'Scum' : 'High-Scum'}. Give back {give2me ? 'two cards' : 'a card'}:
            </div>

            {@const canGive = gameState.cardCountMine[gameState.give0] && (
                give1me ||
                  gameState.cardCountMine[gameState.give1]
                  && !(gameState.give0 === gameState.give1 && gameState.cardCountMine[gameState.give0] < 2)
                )}
            <div class="input-group my-2">
              {#snippet giveSelect(t: 'give0' | 'give1')}
                <select class="form-select" bind:value={gameState[t]}>
                  {#each { length: CardRank.NUM }, i}
                    {@const c = gameState.cardCountMine[i]}
                    {#if c}
                      <option value={i}>{ranks[i]} ({c})</option>
                    {/if}
                  {/each}
                </select>
              {/snippet}
              {@render giveSelect('give0')}
              {#if give2me}
                {@render giveSelect('give1')}
              {/if}
              <button class="btn btn-{canGive ? 'primary' : 'outline-secondary'}"
                class:disabled={!canGive}
                onclick={() => gameState.sendMoveTransfer(gameState.give0, gameState.give1)}>Give</button>
            </div>
          {/if}
          {#if give2}
            <p>The Scum gave the two highest cards to the President, who must choose two cards to give back.</p>
          {/if}
          {#if give1}
            <p>The High-Scum gave the highest card to the Vice-President, who must choose a card to give back.</p>
          {/if}
        </div>
      {:else if canMove}
        {@const wantPass = gameState.pendingMoveRank < 0}
        {@const isScum = playerInfo[turnIndex].role === -2}
        {@const okRank = wantPass ? trickTurn : gameState.allowRank(gameState.pendingMoveRank, isScum)}
        {@const rankOutline = okRank ? '' : 'outline-'}
        {@const maxRank = gameState.revolution ? CardRank.N3 : CardRank.N2}
        <div class="my-2 text-center">
          Your move:
          {#if gameState.pendingMoveRankAck < 0}
            <span class="badge text-bg-{trickTurn ? '' : 'outline-'}danger">PASS</span>
          {:else}
            {@const rank = gameState.pendingMoveRankAck === CardRank.Joker ? maxRank : gameState.pendingMoveRankAck}
            <span class="badge text-bg-{rankOutline}light">{ranks[rank]}</span> &times;{gameState.pendingMoveBaseAck}{#if gameState.pendingMoveJokersAck}+{gameState.pendingMoveJokersAck}{/if}
            <span class="badge text-bg-outline-{okRank ? 'success' : 'danger'}">{okRank ? 'OK' : 'INVALID'}</span>
          {/if}
        </div>

        {@const showMaxButton = gameState.mode.opt1Fewer2 && trickTurn && trickCount > 1}
        <div class="btn-group d-flex my-2" role="group">
          <button class="fw-bold w-100 btn btn-{gameState.pendingMoveRankAck < 0 ? '' : 'outline-'}{trickTurn ? 'danger' : 'secondary'}"
            class:active={wantPass}
            onclick={() => (gameState.pendingMoveRank = -1, gameState.sendMove())}>Pass</button>
          {#snippet rankButton(i: CardRank)}
            {@const rank = i == CardRank.Joker ? maxRank : i}
            {@const cards = gameState.cardCountMine[rank]}
            <button class="fw-bold w-100 btn btn-{gameState.pendingMoveRankAck === i ? '' : 'outline-'}{(cards ? ['warning', 'info', 'success', 'primary'] : ['danger', 'secondary'])[gameState.allowRank(i, isScum)]}"
              class:active={gameState.pendingMoveRank === i}
              onclick={() => (gameState.setPendingRank(i, cards, i === maxRank), gameState.sendMove())}>{ranks[rank]}{showMaxButton && i === maxRank ? '-' : ''}</button>
          {/snippet}
          {#if showMaxButton && gameState.revolution}
            {@render rankButton(CardRank.Joker)}
          {/if}
          {#each { length: CardRank.Joker }, i}
            {@render rankButton(i)}
          {/each}
          {#if showMaxButton && !gameState.revolution}
            {@render rankButton(CardRank.Joker)}
          {/if}
        </div>

        <div class="my-2">
          <small>
            Legend:
            can play
            <span class="badge text-bg-outline-primary">all cards</span>,
            <span class="badge text-bg-outline-success">leftover cards</span>,
            <span class="badge text-bg-outline-info">need jokers</span>,
            <span class="badge text-bg-outline-secondary">using jokers</span>
            cannot play
            <span class="badge text-bg-outline-warning">have cards</span>,
            <span class="badge text-bg-outline-danger">no cards</span>
          </small>
        </div>

        {#if wantPass}
          {#if trickTurn}
            <div class="alert alert-success">You will pass.</div>
          {:else}
            <div class="alert alert-danger">You cannot pass when starting a trick.</div>
          {/if}
        {:else}
          {#if okRank}
            {@const rank = gameState.pendingMoveRank === CardRank.Joker ? maxRank : gameState.pendingMoveRank}
            {@const is1fewer2 = showMaxButton && gameState.pendingMoveRank === maxRank}
            {@const rankCards = gameState.cardCountMine[rank]}
            {@const jokers = gameState.cardCountMine[CardRank.Joker]}
            {#if !trickTurn}
              {@const min = jokers && gamePhase !== GamePhase.PLAYING_MUST_3 ? 0 : 1}
              {@const max = Number(rankCards)}
              {#if min < max}
                <div class="col">
                  Base Cards
                  <input type="number" class="form-control is-{gameState.pendingMoveBase === gameState.pendingMoveBaseAck ? '' : 'in'}valid"
                    bind:value={gameState.pendingMoveBase}
                    onchange={() => gameState.sendMove()}
                    {min} {max}>
                  <input type="range" class="form-range" bind:value={gameState.pendingMoveBase} onchange={() => gameState.sendMove()} {min} {max}>
                </div>
              {/if}
            {/if}
            {@const trickCountEffective = trickCount - (is1fewer2 ? 1n : 0n)}
            {@const trickMinCards = trickTurn ? trickCountEffective : 1n}
            {@const minJokers = trickMinCards > rankCards ? trickMinCards - rankCards : 0}
            {@const maxJokers = (trickTurn && jokers > trickCountEffective ? trickCountEffective : jokers)}
            {#if minJokers < maxJokers}
              {@const min = minJokers.toString()}
              {@const max = maxJokers.toString()}
              <div class="col">
                Jokers
                <input type="number" class="form-control is-{gameState.pendingMoveJokers === gameState.pendingMoveJokersAck ? '' : 'in'}valid"
                  bind:value={gameState.pendingMoveJokers}
                  onchange={() => gameState.sendMove()}
                  {min} {max}>
                <input type="range" class="form-range" bind:value={gameState.pendingMoveJokers} onchange={() => gameState.sendMove()} {min} {max}>
              </div>
            {/if}
            <div class="alert alert-success">You will make this move.</div>
          {:else}
            <div class="alert alert-danger">
              You cannot make this move.
              {#if gamePhase === GamePhase.PLAYING_MUST_3}
                You must play 3 on the first trick.
              {/if}
            </div>
          {/if}
        {/if}

        <div class="col-12 mb-2">
          <button class="btn btn-primary d-block w-100 mb-2" onclick={() => gameState.sendMoveEnd()}>End Move</button>
        </div>
      {/if}
    {/if}
  </div>
  <div class="col-sm-4">
    <b>Active Players</b>
    <ol class="list-unstyled">
      {#each playerInfo as p, i}
        {@const isMe = gameState.playerIsMe(p)}
        {@const outline = isMe ? '' : '-outline'}
        {#if i === gameState.passIndex && playerInfo.length > 1}
          <li><span class="badge text-bg-outline-success">IN</span></li>
        {/if}
        <li>
          <span class="badge text-bg{outline}-{GameState.ACTIVE && i === turnIndex ? 'primary' : 'secondary'}">{gameState.formatPlayerName(p)}</span>
          {#if i === turnIndex}<span class="badge text-bg{outline}-primary">MOVE</span>{/if}
          {#if p.passed}<span class="badge text-bg{outline}-danger">OUT</span>{/if}
          {p.handSize}
          {#if p.role}
            <PresidentRole role={p.role} />
          {/if}
        </li>
      {:else}
        <li>No players!</li>
      {/each}
    </ol>
    <b>Done Players</b>
    <ol class="list-unstyled">
      {#each playerDiscInfo as p, i}
        <li>
          #{i + (i >= gameState.discIndex ? 1 + playerInfo.length : 1)}:
          <PresidentRoleChange name={p.ownerName} {...p} />
          ({p.hand[CardRank.NUM] ? 'left ' + p.hand[CardRank.NUM] : 'won'}) on {p.trickNum}:{p.trickTurn} in {formatDuration(p.duration)}
        </li>
      {:else}
        <li>No leavers yet!</li>
      {/each}
    </ol>
  </div>
  <div class="col-12 col-sm-8">
    <PresidentMoveHistory moves={moveHistory} />
  </div>
  <div class="col mt-2">
    {#if showCardCount}
      <CardCountTable
        {ranks}
        counts={[
          ['You', gameState.cardCountMine],
          ['Others', gameState.cardCountOthers],
          ['Played', gameState.cardCountDiscard],
          ['Total', gameState.cardCountTotal]
        ]}
      />

      {@const playedCards = Array.from(playedCardGen())}
      {#if playedCards.length}
      Played Cards
        <CardCountTable
          {ranks}
          counts={playedCards}
        />
      {/if}
    {:else}
      <p>You: {gameState.cardCountMine[CardRank.NUM]}, Others: {gameState.cardCountOthers[CardRank.NUM]}, Played: {gameState.cardCountDiscard[CardRank.NUM]}</p>
    {/if}
  </div>
</div>

<div>
  Game Mode: {getGameModeString(gameState.mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
