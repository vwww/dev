<script>
import CardCountTable from '../common/CardCountTable'
import ProgressBar from '../common/ProgressBar'
import RoundPlayerList from '../common/RoundPlayerList'

import DiscardMoveHistory from './DiscardMoveHistory'

import { getGameModeString, playerColor } from './common'

export let gameState
export let ll

const {
  isActive,
  inRound,
  roundState,
  roundTimerStart,
  roundTimerEnd,
  roundPlayers,
  roundPlayerQueue,
  playerInfo,
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
  modeDeck,
} = gameState

$: playing = $isActive && $roundState === 2 && $inRound
$: canMove = playing && gameState.playerIsMe($playerInfo[0])
$: pendingMove = $pendingMoveUseHand ? $myHand : $myAltMove

function getCardDesc (card, ll) {
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

function badMove (a, b) {
  return a === 8 || b === 7 && (a == 5 || a == 6)
}

function moveColor (a, b) {
  return badMove(a, b) ? 'danger' : a === 1 ? 'info' : a !== 4 && a < 7 ? 'primary' : 'secondary'
}
</script>

<script context="module">
export function getCardName (card, ll) {
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

{#if $roundState === 0}
  Waiting for players&hellip;
{:else}
  {#if $roundState === 1}
    Intermission:
  {:else if canMove}
    Make a move:
  {:else}
    Waiting for others to move&hellip;
  {/if}
  <ProgressBar startTime={$roundTimerStart} endTime={$roundTimerEnd} />
{/if}

<div class="row">
  <div class="col-12 mt-2 mb-3">
    Card Descriptions
    <ul>
      {#each [1, 2, 3, 4, 5, 6, 7, 8] as card}
        <li class:font-weight-bold={$roundState === 2 && playing && (card === $myHand || (canMove && card === $myAltMove))}>{getCardName(card, ll)}: {getCardDesc(card, ll)}</li>
      {/each}
    </ul>
  </div>
  {#if $roundState === 2 && playing}
    <div class="col-12">
      Your hand: <span class="badge badge-dark">{getCardName($myHand, ll)}</span>
      {#if canMove}
        <span class="badge badge-dark">{getCardName($myAltMove, ll)}</span>
      {/if}
    </div>
    {#if canMove}
      <div class="col-12">
        <div class="btn-group d-flex mb-3" role="group">
          <div class="input-group-prepend">
            <span class="input-group-text">Discard</span>
          </div>
          <button class:active={$pendingMoveUseHand} class="font-weight-bold w-100 btn btn-outline-{moveColor($myHand, $myAltMove)}"
            on:click={() => gameState.sendMoveUseHand(true)}>{getCardName($myHand, ll)}</button>
          <button class:active={!$pendingMoveUseHand} class="font-weight-bold w-100 btn btn-outline-{moveColor($myAltMove, $myHand)}"
            on:click={() => gameState.sendMoveUseHand(false)}>{getCardName($myAltMove, ll)}</button>
        </div>
      </div>
      <div class="col-12 col-sm-6">
        <div class="form-group">
          <label>
            Target<br>
            <button class="btn btn-outline-{pendingMove !== 4 && pendingMove < 7 ? 'primary' : 'secondary'} dropdown-toggle"
              id="dropdownMenuButtonTarget" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              {$pendingMoveTarget < 0 ? 'auto' : gameState.getNameFromPlayer(gameState.getPlayerInfo($pendingMoveTarget), $pendingMoveTarget)}
            </button>
            <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonTarget">
              <button class="dropdown-item" class:active={$pendingMoveTarget < 0} on:click={() => gameState.sendMoveTarget(-1)}>auto</button>
              {#each $playerInfo as p, i}
                <button class="dropdown-item" class:badge-danger={!i && pendingMove !== 5 || p.immune} class:active={$pendingMoveTarget === i}
                  on:click={() => gameState.sendMoveTarget(i)}>{gameState.getNameFromPlayer(p)}</button>
              {/each}
            </div>
          </label>
          <small class="form-text text-muted">1, 2, 3, 6 targets others; 5 targets any</small>
        </div>
      </div>
      <div class="col-12 col-sm-6">
        <label>
          Guess<br>
          <button class="btn btn-outline-{pendingMove === 1 ? 'info' : 'secondary'} dropdown-toggle"
            id="dropdownMenuButtonGuess" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            {$pendingMoveGuess > 1 ? cardShortNames[$pendingMoveGuess] : 'auto'}
          </button>
          <div class="dropdown-menu" aria-labelledby="dropdownMenuButtonGuess">
            <button class="dropdown-item" class:active={$pendingMoveGuess < 2}
              on:click={() => gameState.sendMoveGuess(0)}>auto</button>
            {#each cardShortNames.slice(2) as m, i}
              <button class="dropdown-item" class:active={$pendingMoveGuess === i+2}
                on:click={() => gameState.sendMoveGuess(i+2)}>{m}</button>
            {/each}
          </div>
        </label>
        <small class="form-text text-muted">only for 1</small>
      </div>
      <div class="col-12 mb-2">
        <button class="btn btn-primary btn-block mb-2" on:click={() => gameState.sendMoveEnd()}>End Move</button>
      </div>
    {/if}
  {/if}
  <div class="col-12 col-sm-4">
    <div class="mb-2">
      <b>Active Players</b>
      {#each $playerInfo as p, i}
        <br><span class="badge badge-{playerColor(gameState.playerIsMe(p))}">{gameState.getNameFromPlayer(p)}</span>
        <span class="badge badge-dark">{gameState.playerIsMe(p) ? getCardName($myHand, ll) : p.hand ? getCardName(p.hand, ll) : '?'}</span>
        {#if !i && roundState === 2}
          <span class="badge badge-dark">{gameState.playerIsMe(p) ? getCardName($myAltMove, ll) : '?'}</span>
        {/if}
        {#if p.immune}<badge class="badge badge-info">IMMUNE</badge>{/if}
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge badge-light">{d}</span>
        {/each}
      {/each}
    </div>
    <div>
      <b>Eliminated</b>
      {#each $playerDiscInfo as p}
        <br><span class="badge badge-secondary">{p.ownerName}</span>
        {p.discardSum}
        {#each p.discarded as d}
          <span class="badge badge-light">{getCardName(d, ll)}</span>
        {/each}
      {/each}
    </div>
  </div>
  <div class="col-12 col-sm-8">
    <DiscardMoveHistory moves={$moveHistory} {ll} />
  </div>
  <div class="col mt-2">
    There {$deckSize === 1 ? 'is 1 card' : `are ${$deckSize} cards`} in the draw pile.
    <CardCountTable
      ranks={['1', '2', '3', '4', '5', '6', '7', '8', 'Total']}
      counts={[
        ['Unplayed', $cardCountRemain],
        ['Discarded', $cardCountDiscard],
        ['Total', $cardCountTotal]
      ]}
    />
  </div>
</div>

<div>
  Game Mode: {getGameModeString($modeDeck)}
</div>

<b>Lobby</b>
<RoundPlayerList inGame={$roundPlayers} inQueue={$roundPlayerQueue} />