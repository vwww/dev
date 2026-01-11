<script lang="ts">
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import CribbageCard from './CribbageCard.svelte'
import { GamePhase, type CribbageGame } from './CribbageGame.svelte'
import CribbageMoveHistory from './CribbageMoveHistory.svelte'
import CribbageScoreReasons from './CribbageScoreReasons.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: CribbageGame
  showValueCrib: boolean
  showValueHand: boolean
  showValuePlay: boolean
  colorScheme: number
}

const { gameState, showValueCrib, showValueHand, showValuePlay, colorScheme }: Props = $props()

const {
  roundState,
  playerInfo,
  turnIndex,
  playing,
  canMove,
  playerDiscInfo,
  mode,
  gamePhase,
  dealer,
  moveHistory,
  trickCount,
  myHand,
  localPlayer,
} = $derived(gameState)
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

<div class="text-center">
  <div class="mb-2">
    Game Phase: { roundState === GameState.ACTIVE ? ['Deal', 'Play', 'Pre-Show', 'Post-Show'][gamePhase] : 'Inactive' }
    <br>
    Turn {gameState.handNum}:{gameState.trickNum}:{gameState.trickTurn}
    <br>
    Crib:
    {#if gameState.cribSize}
      {#each gameState.crib as card}
        <CribbageCard {card} {colorScheme} />
        {' '}
      {/each}
      {#each { length: gameState.cribSize - gameState.crib.length }}
        <span class="badge text-bg-light">?</span>
        {' '}
      {/each}
      {#if showValueCrib && gameState.crib.length}
        {@const [value, scoreReasons] = gameState.scoreShow(gameState.crib, gamePhase !== GamePhase.DEAL)}
        {#if value}
          <br>
          {gameState.crib.length < 4 ? '≥' : '+'}{value} at show
          {#if scoreReasons.length}
            (<CribbageScoreReasons {scoreReasons} {colorScheme} />)
          {/if}
        {/if}
      {/if}
    {:else}
      empty
    {/if}
    {#if localPlayer}
      {@const isDealer = localPlayer === playerInfo[dealer]}
      <br>
      <span class="badge text-bg-{isDealer ? '' : 'outline-'}success">{isDealer ? '' : 'NOT '}DEALER</span>
    {/if}
    {#if gamePhase !== GamePhase.DEAL}
      <br>
      Starter: <CribbageCard card={gameState.starter} {colorScheme} />
    {/if}
  </div>
  {#if playing && localPlayer}
    <div class="mb-2">
      Your hand:
      {#each myHand as card, i}
        <CribbageCard {card} {colorScheme} outline={i >= localPlayer.played.length} />
        {' '}
      {/each}
      {#if showValueHand && myHand.length === 4}
        {@const [value, scoreReasons] = gameState.scoreShow(myHand, gamePhase !== GamePhase.DEAL)}
        <br>
        {gamePhase === GamePhase.DEAL ? '≥' : '+'}{value} at show
        {#if scoreReasons.length}
          (<CribbageScoreReasons {scoreReasons} {colorScheme} />)
        {/if}
      {/if}
      {#if gamePhase !== GamePhase.DEAL}
        <br>
        Count: {trickCount}
        {#each gameState.play as card}
          <CribbageCard {card} {colorScheme} />
          {' '}
        {/each}
      {/if}
    </div>
    <div class="mb-2">
      {#if gamePhase === GamePhase.DEAL}
        {@const pn = playerInfo.indexOf(localPlayer)}
        <p>
          You will move {['first (1st)', 'second (2nd)', 'third (3rd)', 'fourth (4th)'][(pn + playerInfo.length - dealer - 1) % playerInfo.length]}
          {#if pn === dealer}
            as the
          {:else}
            and are not
          {/if}
           dealer.
        </p>
        {#if myHand.length > 4}
          Keep 4 cards, by discarding {playerInfo.length > 2 ? '1 card' : '2 cards'}:
          <table class="table table-sm table-striped w-auto mx-auto">
            <thead>
              <tr>
                <th colspan={playerInfo.length <= 2 ? 2 : 1}>X</th>
                <th>Card</th>
              </tr>
            </thead>
            <tbody>
              {#each myHand as card, i}
                {@const sel0 = gameState.discard0 === i}
                {@const sel1 = playerInfo.length <= 2 && gameState.discard1 === i}
                <tr class:table-danger={sel0 || sel1}>
                  <th>
                    <input class="form-check-input" type="radio"
                      value={i}
                      disabled={sel1}
                      bind:group={gameState.discard0}>
                  </th>
                  {#if playerInfo.length <= 2}
                    <th>
                      <input class="form-check-input" type="radio"
                        value={i}
                        disabled={sel0}
                        bind:group={gameState.discard1}>
                    </th>
                  {/if}
                  <td>
                    <CribbageCard {card} {colorScheme} />
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
          <button class="btn btn-primary btn-lg" onclick={() => gameState.sendMoveKeep()}>&#10060; Discard</button>
        {:else}
          Wait for others to choose cards&hellip;
        {/if}
      {:else if gamePhase === GamePhase.PLAY}
        {#if canMove}
          Choose a card to play:
          <table class="table table-sm table-striped w-auto mx-auto">
            <thead>
              <tr>
                <th>X</th>
                <th>Card</th>
                <th>Count</th>
                {#if showValuePlay}
                  <th>Points</th>
                {/if}
              </tr>
            </thead>
            <tbody>
              {#each myHand as card, i}
                {#if i >= localPlayer.played.length}
                  {@const value = i - localPlayer.played.length}
                  {@const count = Math.min((card >> 2) + 1, 10)}
                  {@const newCount = trickCount + count}
                  {@const [scoreDelta, scoreReasons] = gameState.scorePlay(card)}
                  <tr class:table-success={gameState.pendingMove === value} class:table-danger={newCount > 31}>
                    <th>
                      <input class="form-check-input" type="radio"
                        {value}
                        disabled={newCount > 31}
                        bind:group={gameState.pendingMove}>
                    </th>
                    <td>
                      <CribbageCard {card} {colorScheme} />
                    </td>
                    <td class:table-primary={newCount === 31}>{newCount}</td>
                    {#if showValuePlay}
                      <td>
                        +{scoreDelta}
                        {#if scoreReasons.length}
                          <br>
                          (<CribbageScoreReasons {scoreReasons} {colorScheme} />)
                        {/if}
                      </td>
                    {/if}
                  </tr>
                {/if}
              {/each}
              <tr class:table-warning={gameState.pendingMove === 4}>
                <th>
                  <input class="form-check-input" type="radio"
                    value={4}
                    bind:group={gameState.pendingMove}>
                </th>
                <td colspan={showValuePlay ? 3 : 2}>
                  {gameState.mode.optSkipEmpty && gameState.mode.optSkipPass || myHand.some((card, i) => i >= localPlayer.played.length && trickCount + Math.min((card >> 2) + 1, 10) <= 31) ? 'Random' : 'Pass'}
                </td>
              </tr>
            </tbody>
          </table>
          <button class="btn btn-success btn-lg" onclick={() => gameState.sendMovePlay()}>&#9654; Play</button>
        {:else}
          Wait for others to move&hellip;
        {/if}
      {:else}
        {#if localPlayer.passed}
          Wait for others to finish reviewing&hellip;
        {:else}
          <p>Review the results before the {gamePhase === GamePhase.PRE ? 'show' : 'next hand'}.</p>
          <button class="btn btn-success btn-lg" onclick={() => gameState.sendMoveReady()}>&#9989; Ready</button>
        {/if}
      {/if}
    </div>
  {/if}

  <div class="d-inline-block text-start">
    <b>Active Players</b>
    <ol class="list-unstyled">
      {#each playerInfo as p, i}
        {@const isMe = p === localPlayer}
        {@const outline = isMe ? '' : '-outline'}
        <li>
          <span class="badge text-bg{outline}-{i === turnIndex ? 'primary' : 'secondary'}">{gameState.formatPlayerName(p)}</span>
          <span class="badge text-bg-outline-secondary">{p.score}</span>/{mode.optScoreTarget}
          {#if i === dealer}<span class="badge text-bg{outline}-success">DEALER</span>{/if}
          {#if i === turnIndex}<span class="badge text-bg{outline}-primary">MOVE</span>{/if}
          {#if gamePhase === GamePhase.PLAY}
            {#if p.passed}
              <span class="badge text-bg{outline}-info">PASS</span>
            {:else if !p.handSize}
              <span class="badge text-bg{outline}-info">OUT</span>
            {/if}
          {:else if p.passed}
              <span class="badge text-bg{outline}-info">READY</span>
          {/if}
          {#if isMe && gamePhase === GamePhase.PLAY}
            {#each myHand as card, i}
              <CribbageCard {card} {colorScheme} outline={i >= localPlayer.played.length} />
              {' '}
            {/each}
          {:else}
            {#each p.played as card}
              <CribbageCard {card} {colorScheme} outline={false} />
              {' '}
            {/each}
            {#each { length: p.handSize }}
              <span class="badge text-bg-light">?</span>
            {/each}
          {/if}
          <br>
          <div class="progress mt-1 mb-2" style="height:0.6rem">
            {#if p.score}
              <div class="progress-bar bg-{isMe ? 'success' : 'danger'}" style="width:{Math.min(p.score * 100 / gameState.mode.optScoreTarget, 100)}%"></div>
            {/if}
          </div>
        </li>
      {:else}
        <li>No players!</li>
      {/each}
    </ol>
    {#if playerDiscInfo.length}
      <b>Disconnected Players</b>
      <ol class="list-unstyled">
        {#each playerDiscInfo as p, i}
          {@const outline = p.isMe ? '' : '-outline'}
          <li>
            #{i + playerInfo.length + 1}:
            <span class="badge text-bg{outline}-danger">{p.ownerName}</span>
            <span class="badge text-bg-outline-secondary">{p.score}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </div>
</div>

<div class="mb-3">
  <CribbageMoveHistory moves={moveHistory} {colorScheme} />
</div>

<div>
  Game Mode: {getGameModeString(mode)}
</div>

<b>Lobby</b>
<RoundPlayerList
  localClient={gameState.localClient}
  inGame={gameState.roundPlayers}
  inQueue={gameState.roundPlayerQueue} />
