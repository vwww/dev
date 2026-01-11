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

import { DiscardGame } from './DiscardGame.svelte'
import DiscardPlay from './DiscardPlay.svelte'
import DiscardGameHistory from './DiscardGameHistory.svelte'

import { pState } from '@/util/svelte.svelte'

import { getGameModeString, roomCreateOptions } from './gamemode'

const chatState = new ChatState()
const gameState = new DiscardGame(chatState)

const {
  room: inGame,
  canReset,
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')
let showLLNames = pState('game/mp/discard/LL', true)
let showCardCount = pState('game/mp/_shared/cardCount', true)

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} onchange={() => gameState.sendRename(name.value)} />

<div class="input-group mb-3">
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showLLNames.value}>
      Show Love Letter Names
    </label>
  </span>
  <span class="input-group-text flex-grow-1">
    <label class="form-check mx-auto">
      <input type="checkbox" class="form-check-input" bind:checked={showCardCount.value}>
      Show Detailed Card Count
    </label>
  </span>
</div>

<PIORoomList
bind:this={roomList}
  gameId="discard-l3z5n5wptuoeqtkytj64a"
  roomType="DiscardRoom"
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  {inGame}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onActive={() => gameState.sendActive()}
  onReady={() => gameState.sendReady()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <DiscardPlay {gameState} ll={showLLNames.value} showCardCount={showCardCount.value} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <DiscardGameHistory results={pastGames} ll={showLLNames.value} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient}
      {inGame}
      {canReset}
      onReset={() => gameState.sendReset()}
      columns={[
        ['Score', (p) => p.score],
        ['Win', (p) => p.wins],
        ['Loss', (p) => p.losses],
        ['Streak', (p) => p.streak],
        ['Rank Last', (p) => p.rankLast],
        ['Best', (p) => p.rankBest],
        ['Worst', (p) => p.rankWorst],
      ]}
    />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
