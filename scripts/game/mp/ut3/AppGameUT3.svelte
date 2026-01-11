<script lang="ts">
import Chat from '@gmc/Chat.svelte'
import ChatState, { processChat } from '@gmc/ChatState.svelte'
import GameHistoryCard from '@gmc/GameHistoryCard.svelte'
import Leaderboard from '@gmc/Leaderboard.svelte'
import NameBox from '@gmc/NameBox.svelte'
import PlayCard from '@gmc/PlayCard.svelte'
import TwoPlayerWinner from '@gmc/TwoPlayerWinner.svelte'
import { parseGameModeGeneric } from '@gmc/RoomOption'
import PIORoomList from '@gmc/PIORoomList.svelte'
import { GameState } from '@gmc/game/TurnBasedGame.svelte'

import { UT3Game } from './UT3Game.svelte'
import UT3Play from './UT3Play.svelte'

import { pState } from '@/util/svelte.svelte'

import { roomCreateOptions, getGameModeString } from './gamemode'

const chatState = new ChatState()
const gameState = new UT3Game(chatState)

const {
  room: inGame,
  canReset,
  pastGames,
  leaderboard,
  localClient,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} onchange={() => gameState.sendRename(name.value)} />

<PIORoomList
  bind:this={roomList}
  gameId="ut3-zpfnljsogeu8x8fopwhylg"
  roomType="UT3Room"
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
  <UT3Play {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <TwoPlayerWinner results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient}
      {inGame}
      {canReset}
      onReset={() => gameState.sendReset()}
      columns={[
        ['Streak', (p) => p.streak],
        ['Score', (p) => p.score],
        ['Win', (p) => [p.wins, p.total]],
        ['Loss', (p) => [p.loss, p.total]],
        ['Ties', (p) => [p.ties, p.total]],
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
