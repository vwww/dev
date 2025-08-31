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

import { PresidentGame } from './PresidentGame.svelte'
import PresidentHistory from './PresidentGameHistory.svelte'
import PresidentPlay from './PresidentPlay.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new PresidentGame(chatState)

const {
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
  gameId="president-ftmxqwcwukyisw4waewyua"
  roomType="PresidentRoom"
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
  <PresidentPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <PresidentHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient} columns={[
      ['Score', (p) => p.score],
      ['Streak', (p) => p.streak],
      ['President', (p) => p.roleCount[4]],
      ['VP', (p) => p.roleCount[3]],
      ['Neutral', (p) => p.roleCount[2]],
      ['HS', (p) => p.roleCount[1]],
      ['Scum', (p) => p.roleCount[0]],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
