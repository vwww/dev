<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { colorNames, suitColor, suitNames, suits } from './CribbageCard.svelte'
import { CribbageGame } from './CribbageGame.svelte'
import CribbageHistory from './CribbageGameHistory.svelte'
import CribbagePlay from './CribbagePlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { getGameModeString, roomCreateOptions } from './gamemode'

const chatState = new ChatState()
const gameState = new CribbageGame(chatState)

const {
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')
let colorScheme = pState('game/mp/cribbage/color', 2)
let showValueCrib = pState('game/mp/cribbage/showValueCrib', true)
let showValueHand = pState('game/mp/cribbage/showValueHand', true)
let showValuePlay = pState('game/mp/cribbage/showValuePlay', true)

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} />

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showValueCrib.value}>
      Show Crib Value
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showValueHand.value}>
      Show Hand Value
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showValuePlay.value}>
      Show Play Value
    </label>
  </span>
</div>

<div class="input-group mb-3">
  {#each colorNames as colorName, i}
    <span class="input-group-text flex-grow-1">
      <label class="form-check mx-auto">
        <input type="radio" class="form-check-input" value={i} bind:group={colorScheme.value}>
        {colorName} colors
        {#each { length: 4 }, suit}
          <span class="badge text-bg-outline-{suitColor[i][suit]}" title="{suitNames[suit]} with {colorNames[i].toLowerCase()} colors">{suits[suit]}</span>
          {' '}
        {/each}
      </label>
    </span>
  {/each}
</div>

<PIORoomList
  bind:this={roomList}
  gameId="cribbage-ywbursnjqkgex9dvki7yya"
  roomType="CribbageRoom"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  inGame={gameState.room}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onActive={() => gameState.sendActive()}
  onReady={() => gameState.sendReady()}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <CribbagePlay {gameState}
    colorScheme={colorScheme.value}
    showValueCrib={showValueCrib.value}
    showValueHand={showValueHand.value}
    showValuePlay={showValuePlay.value}
  />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <CribbageHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient} columns={[
      ['Score', (p) => p.score],
      ['Win', (p) => p.wins],
      ['Loss', (p) => p.losses],
      ['Streak', (p) => p.streak],
      ['Rank Last', (p) => p.rankLast],
      ['Best', (p) => p.rankBest],
      ['Worst', (p) => p.rankWorst],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
