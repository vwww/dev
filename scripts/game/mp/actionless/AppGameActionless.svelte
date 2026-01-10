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

import { roomCreateOptions, getGameModeString } from './gamemode'
import { ActionlessGame } from './ActionlessGame.svelte'
import ActionlessHistory from './ActionlessHistory.svelte'
import ActionlessPlay from './ActionlessPlay.svelte'

import { pState } from '@/util/svelte.svelte'

const chatState = new ChatState()
const gameState = new ActionlessGame(chatState)

const {
  room: inGame,
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  bind:this={roomList}
  gameId="actionless-rv9luoetuchidspmvghiq"
  roomType="ActionlessRoom"
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
  <ActionlessPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <ActionlessHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient}
      {inGame}
      onReset={() => gameState.sendReset()}
      columns={[
        ['Streak', (p) => p.streak],
        ['Score', (p) => p.score],
        ['Win', (p) => [p.wins, p.total]],
        ['Loss', (p) => [p.loss, p.total]],
      ]}
    />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      canSend={gameState.room}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
