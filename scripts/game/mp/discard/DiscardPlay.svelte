<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import DiscardMoveHistory from './DiscardMoveHistory.svelte'

import type { DiscardGame } from './DiscardGame.svelte'

import { getGameModeString, playerColor } from './gamemode'

interface Props {
  gameState: DiscardGame
  ll: boolean
  showCardCount: boolean
}

const { gameState, ll, showCardCount }: Props = $props()

const {
  roundState,
  playerInfo,
  turnIndex,
  playing,
  canMove,
  playerDiscInfo,
  myHand,
  myAltMove,
  deckSize,
  cardCountDiscard,
  cardCountRemain,
  cardCountTotal,
  moveHistory,
  pendingMoveUseHand,
  pendingMoveTarget,
  pendingMoveGuess,
} = $derived(gameState)

const pendingMove = $derived(pendingMoveUseHand ? myHand : myAltMove)

function getCardDesc (card: number, ll: boolean): string {
  if (card < 1 || card > 8) return 'unknown'
  return [
    'target another player and guess hand value (not 1); if correct, target discards without effect and loses (5/deck)',
    'target another player; you look at his hand (2/deck)',
    'target another player; compare; lower player loses (no action on tie) (2/deck)',
    'prevent being targeted until your next turn (2/deck)',
    'target one player (including self); target discards (with effect only for 8) and (if not 8) draws new card (2/deck)',
    'target another player; trade cards (1/deck)',
    `no action, but must discard if other is ${getCardName(5, ll)} or ${getCardName(6, ll)} (1/deck)`,
    'lose (try not to discard this) (1/deck)',
  ][card - 1]
}

const cardShortNames = [
  '',
  '1 (5/deck)',
  '2 (2/deck)',
  '3 (2/deck)',
  '4 (2/deck)',
  '5 (2/deck)',
  '6 (1/deck)',
  '7 (1/deck)',
  '8 (1/deck)',
]

function badMove (a: number, b: number): boolean {
  return a === 8 || b === 7 && (a == 5 || a == 6)
}

function moveColor (a: number, b: number): string {
  return badMove(a, b) ? 'danger' : a === 1 ? 'info' : a !== 4 && a < 7 ? 'primary' : 'secondary'
}
</script>

<script lang="ts" module>
export function getCardName (card: number, ll: boolean): string | number {
  if (ll) {
    return [
      'Guard (1)',
      'Priest (2)',
      'Baron (3)',
      'Handmaid (4)',
      'Prince (5)',
      'King (6)',
      'Countess (7)',
      'Princess (8)',
    ][card - 1]
  } else {
    if (card <= 8) return card
    return ['0b', '0c', '2b', '3b', '4b', '5b', '6b', '7b', '9b'][card - 9]
  }
}
</script>

<div class="mb-2">
  {#if roundState === GameState.WAITING}
    Waiting for players&hellip;
  {:else}
    {#if roundState === GameState.INTERMISSION}
      Intermission:
    {:else if canMove}
      Make a move:
    {:else}
      Waiting for others to move&hellip;
    {/if}
    <ProgressBar
      startTime={gameState.roundTimerStart}
      endTime={gameState.roundTimerEnd}
      active={gameState.room} />
  {/if}
</div>

<div class="row">
  <div class="col-12 mb-3">
    <div class="card my-2">
      <div class="card-header">
        <h4 class="card-title">
          <a data-bs-toggle="collapse" href="#collapseCardDesc">
            <small>Card Descriptions</small>
          </a>
        </h4>
      </div>
      <div id="collapseCardDesc" class="card-collapse collapse show">
        <div class="card-body">
          <ul>
            {#each [1, 2, 3, 4, 5, 6, 7, 8] as card}
              <li class:fw-bold={roundState === GameState.ACTIVE && playing && (card === myHand || (canMove && card === myAltMove))}>{getCardName(card, ll)}: {getCardDesc(card, ll)}</li>
            {/each}
          </ul>
        </div>
      </div>
    </div>
  </div>
  {#if roundState === GameState.ACTIVE && playing}
    <div class="col-12">
      Your hand:
      <span class="badge text-bg-dark">{getCardName(myHand, ll)}</span>
      {#if canMove}
        <span class="badge text-bg-dark">{getCardName(myAltMove, ll)}</span>
      {/if}
    </div>
    {#if canMove}
      <div class="col-12">
        <div class="btn-group d-flex mb-3" role="group">
          <span class="input-group-text">Discard</span>
          <button class:active={pendingMoveUseHand} class="fw-bold w-100 btn btn-outline-{moveColor(myHand, myAltMove)}"
            onclick={() => gameState.sendMoveUseHand(true)}>{getCardName(myHand, ll)}</button>
          <button class:active={!pendingMoveUseHand} class="fw-bold w-100 btn btn-outline-{moveColor(myAltMove, myHand)}"
            onclick={() => gameState.sendMoveUseHand(false)}>{getCardName(myAltMove, ll)}</button>
        </div>
      </div>
      <div class="col-12 col-sm-6 mb-2">
        <label>
          Target<br>
          <button class="btn btn-outline-{pendingMove !== 4 && pendingMove < 7 ? 'primary' : 'secondary'} dropdown-toggle"
            id="dropdownMenuButtonTarget" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {pendingMoveTarget < 0 ? 'auto' : gameState.formatPlayerName(gameState.playerInfo[pendingMoveTarget], pendingMoveTarget)}
          </button>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonTarget">
            <button class="dropdown-item" class:active={pendingMoveTarget < 0} onclick={() => gameState.sendMoveTarget(-1)}>auto</button>
            {#each playerInfo as p, i}
              <button class="dropdown-item" class:text-bg-danger={i === turnIndex && pendingMove !== 5 || p.immune} class:active={pendingMoveTarget === i}
                onclick={() => gameState.sendMoveTarget(i)}>{gameState.formatPlayerName(p)}</button>
            {/each}
          </div>
        </label>
        <small class="form-text text-muted">1, 2, 3, 6 targets others; 5 targets any</small>
      </div>
      <div class="col-12 col-sm-6 mb-3">
        <label>
          Guess<br>
          <button class="btn btn-outline-{pendingMove === 1 ? 'info' : 'secondary'} dropdown-toggle"
            id="dropdownMenuButtonGuess" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {pendingMoveGuess > 1 ? cardShortNames[pendingMoveGuess] : 'auto'}
          </button>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonGuess">
            <button class="dropdown-item" class:active={pendingMoveGuess < 2}
              onclick={() => gameState.sendMoveGuess(0)}>auto</button>
            {#each cardShortNames.slice(2) as m, i}
              <button class="dropdown-item" class:active={pendingMoveGuess === i+2}
                onclick={() => gameState.sendMoveGuess(i+2)}>{m}</button>
            {/each}
          </div>
        </label>
        <small class="form-text text-muted">only for 1</small>
      </div>
      <div class="col-12 mb-2">
        <button class="btn btn-primary d-block w-100 mb-2" onclick={() => gameState.sendMoveEnd()}>End Move</button>
      </div>
    {/if}
  {/if}
  <div class="col-12 col-sm-4">
    <b>Active Players</b>
    <ol class="list-unstyled">
      {#each playerInfo as p, i}
        {@const isMe = gameState.playerIsMe(p)}
        {@const outline = isMe ? '' : '-outline'}
        <li>
          <span class="badge text-bg{outline}-{playerColor(isMe)}">{gameState.formatPlayerName(p)}</span>
          <span class="badge text-bg{outline}-dark">{isMe ? getCardName(myHand, ll) : p.hand ? getCardName(p.hand, ll) : '?'}</span>
          {#if roundState === GameState.ACTIVE && i === turnIndex}
            <span class="badge text-bg{outline}-dark">{isMe ? getCardName(myAltMove, ll) : '?'}</span>
          {/if}
          {#if p.immune}<span class="badge text-bg{outline}-info">IMMUNE</span>{/if}
          {p.discardSum}
          {#each p.discarded as d}
            <span class="badge text-bg-light">{d}</span>
          {/each}
        </li>
      {:else}
        <li>No players!</li>
      {/each}
    </ol>
    <b>Eliminated</b>
    <ol class="list-unstyled">
      {#each playerDiscInfo as p, i}
        {@const outline = p.isMe ? '' : '-outline'}
        <li>
          #{i + (i >= gameState.discIndex ? 1 + playerInfo.length : 1)}:
          <span class="badge text-bg{outline}-danger">{p.ownerName}</span>
          {p.discardSum}
          {#each p.discarded as d}
            <span class="badge text-bg-light">{d}</span>
          {/each}
        </li>
      {:else}
        <li>No eliminations yet!</li>
      {/each}
    </ol>
  </div>
  <div class="col-12 col-sm-8">
    <DiscardMoveHistory moves={moveHistory} {ll} />
  </div>
  <div class="col mt-2">
    Draw pile count: {deckSize} (players have {cardCountRemain[8] - deckSize})
    {#if showCardCount}
      <CardCountTable
        ranks={['1', '2', '3', '4', '5', '6', '7', '8', 'Total']}
        counts={[
          ['Unplayed', cardCountRemain],
          ['Discarded', cardCountDiscard],
          ['Total', cardCountTotal]
        ]}
      />
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
