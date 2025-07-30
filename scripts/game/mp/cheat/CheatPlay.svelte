<script lang="ts">
import CardCountTable from '@gmc/CardCountTable.svelte'
import ProgressBar from '@gmc/ProgressBar.svelte'
import RoundPlayerList from '@gmc/RoundPlayerList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import CheatMoveHistory from './CheatMoveHistory.svelte'

import { CardRank, CheatModeTricks, type CardCountTotal, type CheatGame } from './CheatGame2.svelte'

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

const isSkip = $derived(!gameState.mode.optTricks)
</script>

<script module>
export const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', '*', 'Total']
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

<div class="row">
  <div class="col-12">
    <div class="mb-2 text-center">
      {#if gameState.trickCount}
        Trick: <span class="badge text-bg-light">{ranks[gameState.trickRank]}</span> &times;{gameState.trickCount}
      {:else}
        Not currently in a trick
      {/if}
    </div>

    {#if roundState === GameState.ACTIVE}
      {#if playing}
        <button
          class="btn btn-{gameState.canChallenge ? gameState.shouldChallenge ? 'primary' : 'secondary' : 'outline-danger'} d-block w-100 mb-2"
          onclick={() => gameState.sendMoveCallCheat()}>Call Cheat</button>

        {#if canMove}
          {@const canSkipPass = gameState.mode.optTricks < CheatModeTricks.FORCE}
          {@const pendingPass = gameState.pendingMoveClaim < 0}
          <div class="btn-group d-flex mb-3" role="group">
            <button class="fw-bold w-100 btn btn-outline-danger" class:disabled={!canSkipPass}
              class:active={pendingPass}
              onclick={() => (gameState.pendingMoveClaim = -1, gameState.sendMove())}>{gameState.mode.optTricks ? 'Pass' : 'Skip'}</button>
            {#each { length: CardRank.NUM - 1 }, i}
              <button class="fw-bold w-100 btn btn-outline-{gameState.allowRank(i) ? 'primary' : 'secondary'}"
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

          {@const okRank = pendingPass ? canSkipPass : gameState.allowRank(gameState.pendingMoveClaim)}
          {@const okCount = pendingPass || gameState.allowCount(gameState.pendingMoveTotal)}
          {#if !(okRank && okCount)}
            <div class="alert alert-danger">
              <p>{#if !okRank}Rank is bad.{/if} {#if !okCount}Count is bad.{/if}</p>
            </div>
          {/if}

          <div class="col-12 mb-2">
            <button class="btn btn-primary d-block w-100 mb-2" onclick={() => gameState.sendMoveEnd()}>End Move</button>
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
    <div class="mb-2">
      <b>Active Players</b>
      {#each playerInfo as p, i}
        {@const isMe = gameState.playerIsMe(p)}
        {@const outline = isMe ? '' : '-outline'}
        {#if i === gameState.passIndex}
          <br><badge class="badge text-bg-outline-success">IN</badge>
        {/if}
        <br><span class="badge text-bg{outline}-{GameState.ACTIVE && i === turnIndex ? 'primary' : 'secondary'}">{gameState.formatPlayerName(p)}</span>
        {#if i === turnIndex}<badge class="badge text-bg{outline}-primary">MOVE</badge>{/if}
        {#if p.passed}<badge class="badge text-bg{outline}-danger">OUT</badge>{/if}
        {p.handSize}
      {:else}
        <br>No players!
      {/each}
    </div>
    <div>
      <b>Done Players</b>
      {#each playerDiscInfo as p}
        {@const outline = p.isMe ? '' : '-outline'}
        <br><span class="badge text-bg{outline}-{p.handSize ? 'danger' : 'success'}">{p.ownerName}</span>
        ({p.handSize ? 'left ' + p.handSize : 'success'}) {p.duration / 1000}s
      {:else}
        <br>No leavers yet!
      {/each}
    </div>
  </div>
  <div class="col-12 col-sm-8">
    <CheatMoveHistory moves={moveHistory} {isSkip} />
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
      <!-- gameState.cardCountClaimDisc -->
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
