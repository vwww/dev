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
import { RPSGame } from './RPSGame2.svelte'
import RPSHistory from './RPSHistory.svelte'
import RPSPlay from './RPSPlay.svelte'

import { pState } from '@/util/svelte.svelte'

const chatState = new ChatState()
const gameState = new RPSGame(chatState)

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
  gameId="rps-oj40aopjv0w7gnc1pj9zpq"
  roomType="RPSRoom"
  joinData={{ name: name.value }}
  gameRoom={gameState.room}
  onJoinedRoom={(room) => gameState.enterGame(room, name.value)}
  formatGameMode={(roomData) => getGameModeString(parseGameModeGeneric(roomCreateOptions, roomData))}
  {roomCreateOptions} />

<PlayCard
  inGame={gameState.room}
  isActive={gameState.localClient.active}
  canReady={roundState === GameState.INTERMISSION}
  isReady={gameState.localClient.ready}
  onSetActive={(a) => gameState.sendActive(a)}
  onSetReady={(r) => gameState.sendReady(r)}
  onReset={() => gameState.sendReset()}
  onDisconnect={() => (gameState.leaveGame(), roomList.refreshRooms())}>
  <RPSPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-xl-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <RPSHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard {leaderboard} {localClient} columns={[
      ['Streak', (p) => p.roundStreak],
      ['Score', (p) => p.roundScore],
      ['Round Win', (p) => [p.roundWins, p.roundTotal]],
      ['Tie', (p) => [p.roundTies, p.roundTotal]],
      ['Loss', (p) => [p.roundLosses, p.roundTotal]],
      ['Battle Win', (p) => [p.battleWins, p.battleTotal]],
      ['Tie', (p) => [p.battleTies, p.battleTotal]],
      ['Loss', (p) => [p.battleLosses, p.battleTotal]],
      ['B Score', (p) => p.battleWins - p.battleLosses],
    ]} />
  </div>

  <div class="col-12 col-xl-4 mb-3">
    <Chat
      {chatState}
      onInput={msg => processChat(gameState, msg)}
    />
  </div>
</div>
