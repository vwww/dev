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
import { BlackjackGame } from './BlackjackGame2.svelte'
import BlackjackHistory from './BlackjackHistory.svelte'
import BlackjackPlay from './BlackjackPlay.svelte'

import { pState } from '@/util/svelte.svelte'

const chatState = new ChatState()
const gameState = new BlackjackGame(chatState)

const {
  pastGames,
  leaderboard,
  roundState,
} = $derived(gameState)

let name = pState('game/mp/_shared/name', '')

let roomList: PIORoomList
</script>

<NameBox bind:value={name.value} />

<PIORoomList
  bind:this={roomList}
  gameId="blackjack-6zesndxegeqvedc1obxixa"
  roomType="BlackjackRoom"
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
  <BlackjackPlay {gameState} />
</PlayCard>

<div class="row">
  <div class="col-12 col-lg-8">
    <GameHistoryCard
      canClear={pastGames.length}
      onClear={() => gameState.clearHistory()}>
      <BlackjackHistory results={pastGames} />
    </GameHistoryCard>

    <Leaderboard players={leaderboard} columns={[
      ['Score', (p) => p.score],
      ['Wins', (p) => p.wins],
      ['Streak', (p) => p.streak],
    ]} />
  </div>

  <div class="col-12 col-lg-4 mb-3">
    <Chat
      {chatState}
      onInput={(msg) => processChat(gameState, msg)}
    />
  </div>
</div>
