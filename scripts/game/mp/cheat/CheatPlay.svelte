<script lang="ts">
import { formatDuration } from '@gmc/game/common'
import CardCountBars from '@gmc/CardCountBars.svelte'
import CardCountInline from '@gmc/CardCountInline.svelte'
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import CheatMoveHistory from './CheatMoveHistory.svelte'

import { CardRank, CheatModeTricks, type CardCountTotal, type CheatGame } from './CheatGame.svelte'

import { getGameModeString } from './gamemode'

interface Props {
  gameState: CheatGame
}

const { gameState }: Props = $props()

const {
  localClient,
  roundState,
  playerInfo,
  turnIndex,
  playing,
  canMove,
  playerDiscInfo,
  moveHistory,
} = $derived(gameState)

let showHandBars = $state(false)
</script>

<script module>
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', '*', 'Total']
</script>

<div class="mb-2">
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
</div>

<div class="row">
  <div class="col-12 mb-3">
    <div class="mb-2 text-center">
      Trick {gameState.trickNum}
      {#if gameState.trickTurn}
        Move {gameState.trickTurn}: <span class="badge text-bg-light">{ranks[gameState.trickRank]}</span> &times;{gameState.trickCount}
      {:else}
        Move 0
      {/if}
    </div>

    {#if roundState === GameState.ACTIVE}
      {#if playing}
        <button
          class="btn btn-{gameState.canChallenge && gameState.shouldChallenge ? '' : 'outline-'}danger d-block w-100 mb-2"
          class:disabled={!gameState.canChallenge}
          onclick={() => gameState.sendMoveCallCheat()}>Call Cheat</button>

        {@const CardCountComponent = showHandBars ? CardCountBars : CardCountInline}
        <div class="my-2">
          <label class="form-check d-inline-block">
            <input type="checkbox" class="form-check-input" bind:checked={showHandBars}>
            <span class="form-check-label">Your hand:</span>
          </label>
          <CardCountComponent {ranks} cards={gameState.cardCountHandMine} />
        </div>

        {#if canMove}
          {@const canPass = gameState.mode.optTricks !== CheatModeTricks.FORCED && gameState.trickTurn}
          {@const pendingPass = gameState.pendingMoveClaim < 0}
          {@const okRank = pendingPass ? canPass : gameState.allowRank(gameState.pendingMoveClaim)}
          {@const okCount = pendingPass || gameState.allowCount(gameState.pendingMoveTotal)}
          {@const rankOutline = okRank ? '' : 'outline-'}
          {@const countOutline = okCount ? '' : 'outline-'}
          <div class="mb-2 text-center">
            Your move:
            {#if pendingPass}
              <span class="badge text-bg-{canPass ? '' : 'outline-'}danger">PASS</span>
            {:else}
              <span class="badge text-bg-{rankOutline}light">{ranks[gameState.pendingMoveClaim]}</span> &times;{gameState.pendingMoveTotal}
              {#if gameState.pendingMoveTotal > 6n * gameState.mode.optDecks}
                <span class="badge text-bg-outline-danger">IMPOSSIBLE</span>
              {:else if gameState.pendingMoveTotal == BigInt(gameState.pendingMoveNum[gameState.pendingMoveClaim]) + BigInt(gameState.pendingMoveNum[CardRank.Joker])}
                <span class="badge text-bg-{countOutline}success">HONEST</span>
              {:else}
                <span class="badge text-bg-{countOutline}warning">BLUFF</span>
              {/if}
            {/if}
          </div>

          <div class="btn-group d-flex mb-3" role="group">
            <button class="fw-bold w-100 btn btn-{gameState.pendingMoveClaimAck < 0 ? '' : 'outline-'}{canPass ? 'danger' : 'secondary'}"
              class:active={pendingPass}
              onclick={() => (gameState.pendingMoveClaim = -1, gameState.sendMove())}>Pass</button>
            {#each { length: CardRank.NUM - 1 }, i}
              <button class="fw-bold w-100 btn btn-{gameState.pendingMoveClaimAck == i ? '' : 'outline-'}{gameState.allowRank(i) ? 'primary' : 'secondary'}"
                class:active={gameState.pendingMoveClaim == i}
                onclick={() => (gameState.pendingMoveClaim = i, gameState.sendMove())}>{ranks[i]}</button>
            {/each}
          </div>

          <div class="row">
            {#each { length: CardRank.NUM }, i}
              {#if gameState.cardCountHandMine[i]}
                {@const max = gameState.cardCountHandMine[i].toString()}
                <div class="col-4 col-md-3 col-lg-2">
                  {ranks[i]}
                  <input type="number" class="form-control is-{gameState.pendingMoveNum[i] === Number(gameState.pendingMoveAck[i]) ? '' : 'in'}valid"
                    bind:value={gameState.pendingMoveNum[i]}
                    onchange={() => gameState.sendMove()}
                    min="0" {max}>
                  <input type="range" class="form-range" bind:value={gameState.pendingMoveNum[i]} onchange={() => gameState.sendMove()} min="0" {max}>
                </div>
              {/if}
            {/each}
          </div>

          {#if !(okRank && okCount)}
            <div class="alert alert-danger">
              {#if pendingPass}
                Passing is not allowed{#if gameState.mode.optTricks !== CheatModeTricks.FORCED}{' '}on a new trick{/if}.
              {:else}
                {#if !okRank}
                  Rank {ranks[gameState.pendingMoveClaim]} is not allowed.
                {/if}
                {#if !okCount}
                  Count {gameState.pendingMoveTotal} is not allowed{#if !gameState.pendingMoveTotal && gameState.mode.optCountZero}{' '}on a new trick{/if}.
                {/if}
              {/if}
            </div>
          {/if}

          <div class="col-12 mb-2">
            <button class="btn btn-{false ? 'outline-' : ''}primary d-block w-100 mb-2" onclick={() => gameState.sendMoveEnd()}>End Move</button>
          </div>
        {/if}
      {/if}

      <ProgressBar
        startTime={gameState.callTimerStart}
        endTime={gameState.callTimerEnd}
        active={gameState.room} />
    {/if}
  </div>
  <div class="col-12 col-sm-4">
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
        </li>
      {:else}
        <li>No players!</li>
      {/each}
    </ol>
    <b>Done Players</b>
    <ol class="list-unstyled">
      {#each playerDiscInfo as p, i}
        {@const outline = p.isMe ? '' : '-outline'}
        <li>
          #{i + (i >= gameState.discIndex ? 1 + playerInfo.length : 1)}:
          <span class="badge text-bg{outline}-{p.handSize ? 'danger' : 'success'}">{p.ownerName}</span>
          ({p.handSize ? 'left ' + p.handSize : 'won'}) on trick {p.trickNum} in {formatDuration(p.duration)}
        </li>
      {:else}
        <li>No leavers yet!</li>
      {/each}
    </ol>
  </div>
  <div class="col-12 col-sm-8">
    <CheatMoveHistory moves={moveHistory} />
  </div>
  <div class="col mt-2">
    {#if roundState === GameState.ACTIVE && playing}
      <div>
        Your cards
        <CardCountTable
          {ranks}
          counts={[
            ['Hand', gameState.cardCountHandMine],
            ['Played', gameState.cardCountAllMine.map((v, i) => v - gameState.cardCountHandMine[i]) as CardCountTotal],
            ['Yours', gameState.cardCountAllMine],
          ]}
        />
      </div>

      <div>
        Actual cards
        <CardCountTable
          {ranks}
          counts={[
            ['Yours', gameState.cardCountAllMine],
            ['Others', gameState.cardCountTotal.map((v, i) => v - gameState.cardCountAllMine[i]) as CardCountTotal],
            ['Total', gameState.cardCountTotal]
          ]}
        />
      </div>

      <div>
        Claimed cards
        <CardCountTable
          {ranks}
          counts={[
            ['Your Claim', gameState.cardCountClaimMine],
            ['Others Claim', gameState.cardCountClaimOthers],
            ['Remaining Claim', gameState.cardCountClaimRemain],
            ['Total', gameState.cardCountTotal]
          ]}
        />
      </div>
    {:else}
      <CardCountTable
        {ranks}
        counts={[
          ['Others Claim', gameState.cardCountClaimOthers],
          ['Remaining Claim', gameState.cardCountClaimRemain],
          ['Total', gameState.cardCountTotal]
        ]}
      />
    {/if}
    {#if playerInfo.length}
      <CardCountTable
        {ranks}
        counts={playerInfo.map((p) => [gameState.formatPlayerName(p), p.discardClaim])}
      />
      <!-- TODO gameState.cardCountClaimDisc -->
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
